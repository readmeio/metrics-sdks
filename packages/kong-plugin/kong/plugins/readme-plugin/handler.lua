local Queue = require "kong.tools.queue"
local cjson = require "cjson"
local url = require "socket.url"
local http = require "resty.http"
local openssl_digest = require "resty.openssl.digest"

local kong = kong
local ngx = ngx
local encode_base64 = ngx.encode_base64
local tostring = tostring
local tonumber = tonumber
local fmt = string.format
local pairs = pairs
local max = math.max

-- this is used so we don't have to parse the url every time we log.
local parsed_urls_cache = {}

-- Parse host url.
-- @param `url` host url
-- @return `parsed_url` a table with host details:
-- scheme, host, port, path, query, userinfo
local function parse_url(host_url)
  local parsed_url = parsed_urls_cache[host_url]

  if parsed_url then
    return parsed_url
  end

  parsed_url = url.parse(host_url)
  if not parsed_url.port then
    if parsed_url.scheme == "http" then
      parsed_url.port = 80

    elseif parsed_url.scheme == "https" then
      parsed_url.port = 443
    end
  end
  if not parsed_url.path then
    parsed_url.path = "/"
  end

  parsed_urls_cache[host_url] = parsed_url

  return parsed_url
end

-- This will generate an integrity hash that looks something like this:
-- sha512-Naxska/M1INY/thefLQ49sExJ8E+89Q2bz/nC4Pet52iSRPtI9w3Cyg0QdZExt0uUbbnfMJZ0qTabiLJxw6Wrg==?1345
-- With the last 4 digits on the end for us to use to identify it later in a list.
local function hash_value(value)
  local last_4_digits = value:sub(-4)
  local digest = openssl_digest.new("sha512")
  local encoded_value = encode_base64(digest:final(value))
  return encoded_value .. "?" .. last_4_digits
end


-- Creates a payload for ReadMe
-- @return JSON string in ReadMe API Log format
local function make_readme_payload(conf, entries)
  local payload = {}
  for _, entry in ipairs(entries) do
    local request_entry = {
      pageref = entry.request.url,
      startedDateTime = os.date("!%Y-%m-%dT%H:%M:%SZ", entry.started_at / 1000),
      time = entry.latencies.request,
      request = {
        httpVersion = entry.request.httpVersion,
        headers = {},
        method = entry.request.method,
        queryString = {},
        bodySize = entry.request.size,
        url = entry.request.url,
      },
      response = {
        status = entry.response.status,
        headers = {},
        content = {
          mimeType = entry.response.mimeType,
          size = entry.response.size,
        },
        bodySize = entry.response.size
      }
    }


    -- Convert headers
    for name, value in pairs(entry.request.headers) do
      local final_value = value
      if conf.hide_headers[name] then
        if conf.hide_headers[name] == "" then
          kong.log.debug("Hiding request header: ", name)
          break
        else
          final_value = conf.hide_headers[name]
          kong.log.debug("Overriding request header: ", name, " with ", final_value)
        end
      end
      table.insert(request_entry.request.headers, {name = name, value = final_value})
    end

    for name, value in pairs(entry.response.headers) do
      local final_value = value
      if conf.hide_headers[name] then
        if conf.hide_headers[name] == "" then
          kong.log.debug("Hiding response header: ", name)
          break
        else
          final_value = conf.hide_headers[name]
          kong.log.debug("Overriding response header: ", name, " with ", final_value)
        end
      end
      table.insert(request_entry.response.headers, {name = name, value = final_value})
    end

    for name, value in pairs(entry.request.querystring) do
      table.insert(request_entry.request.queryString, {name = name, value = value})
    end

    local group = {}
    if conf.group_by then
      for header_name, group_value in pairs(conf.group_by) do
        local header_value = entry.request.headers[header_name]
        group[group_value] = header_value or "none"
      end
    end

    local id_header = (conf.id_header and conf.id_header:lower()) or "authorization"
    local id = entry.request.headers[id_header] or "none"
    if id_header == "authorization" and entry.raw_auth then
      id = entry.raw_auth
    end
    group.id = hash_value(id)

    local api_log = {
      httpVersion = entry.httpVersion,
      requestBody = {},
      responseBody = {},

      clientIPAddress = entry.client_ip,
      createdAt = request_entry.startedDateTime,
      development = false,
      error = nil,
      group = group,
      _id = entry.request.id,
      method = entry.request.method,
      normalizedPath = entry.normalized_path,
      queryString = request_entry.request.queryString,
      request = {
        log = {
          creator = {
            comment = "Kong " .. kong.version,
            name = "readme-metrics (kong)",
            version = "1.0.0"
          },
          entries = {request_entry}
        },
      },
      requestHeaders = request_entry.request.headers,
      responseHeaders = request_entry.response.headers,
      responseTime = entry.latencies.request,
      startedDateTime = request_entry.startedDateTime,
      status = entry.response.status,
      url = entry.request.url
    }

    table.insert(payload, api_log)
  end

  return cjson.encode(payload)
end

-- Sends the provided entries to ReadMe
-- @return true if everything was sent correctly, falsy if error
-- @return error message if there was an error
local function send_entries(conf, entries)
  local payload = make_readme_payload(conf, entries)
  local content_length = #payload
  local method = "POST"
  local timeout = conf.timeout
  local keepalive = conf.keepalive
  local proxy_endpoint = conf.proxy_endpoint
  local http_endpoint = proxy_endpoint or "https://metrics.readme.io/v1/request"
  local api_key = conf.api_key

  local parsed_url = parse_url(http_endpoint)
  local host = parsed_url.host
  local port = tonumber(parsed_url.port)

  local httpc = http.new()
  httpc:set_timeout(timeout)

  local headers = {
    ["Content-Type"] = "application/json",
    ["Content-Length"] = content_length,
    ["Authorization"] = "Basic " ..encode_base64(api_key .. ":") or nil
  }

  local log_server_url = fmt("%s://%s:%d%s", parsed_url.scheme, host, port, parsed_url.path)
  local res, err = httpc:request_uri(log_server_url, {
    method = method,
    headers = headers,
    body = payload,
    keepalive_timeout = keepalive,
    ssl_verify = false,
  })
  if not res then
    return nil, "failed request to " .. host .. ":" .. tostring(port) .. ": " .. err
  end

  -- always read response body, even if we discard it without using it on success
  local response_body = res.body

  kong.log.debug(fmt("sent data to ReadMe, %s:%s HTTP status %d %s", host, port, res.status, response_body))

  if res.status < 300 then
    return true

  else
    return nil, "request to " .. host .. ":" .. tostring(port)
      .. " returned status code " .. tostring(res.status) .. " and body "
      .. response_body
  end
end


local HttpLogHandler = {
  PRIORITY = 12,
  VERSION = "0.0.1",
}

function HttpLogHandler:log(conf)
  local queue_conf = Queue.get_plugin_params("readme-plugin", conf, 'readme-plugin')
  -- this creates a object with some request and response details. see https://docs.konghq.com/gateway/latest/plugin-development/pdk/kong.log/#konglogserialize
  local info = kong.log.serialize()
  -- add more details to the info object
  local scheme = kong.request.get_scheme()
  local version = kong.request.get_http_version()
  info.httpVersion = scheme .. "/" .. version
  info.mimeType = kong.response.get_header("Content-Type")
  info.normalized_path = kong.request.get_path()
  info.raw_auth = kong.request.get_header("Authorization")

  -- This sends configuration and current request data to a queue for processing. will call `send_entries` function.
  local ok, err = Queue.enqueue(
    queue_conf,
    send_entries,
    conf,
    info
  )
  if not ok then
    kong.log.err("Failed to enqueue log entry to log server: ", err)
  end
end

return HttpLogHandler
