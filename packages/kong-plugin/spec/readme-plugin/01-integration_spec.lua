-- Helper functions provided by Kong Gateway, see https://github.com/Kong/kong/blob/master/spec/helpers.lua
local helpers = require "spec.helpers"
local http_mock = require "spec.helpers.http_mock"
local tapping = require "spec.helpers.http_mock.tapping"

-- matches our plugin name defined in the plugins's schema.lua
local PLUGIN_NAME = "readme-plugin"

-- Run the tests for each strategy. Strategies include "postgres" and "off"
--   which represent the deployment topologies for Kong Gateway
for _, strategy in helpers.all_strategies() do
  describe(PLUGIN_NAME .. ": [#" .. strategy .. "]", function()
    -- Will be initialized before_each nested test
    local client
    local mock, mock_port

    setup(function()
      mock, mock_port = http_mock.new(nil, {
        ["/"] = {
          access = [[
            ngx.req.set_header("X-Test", "test")
            ngx.print("hello world")
            ngx.exit(200)
          ]],
        },
      }, {
        log_opts = {
          req = true,
          req_body = true,
          req_body_large = true,
          collect_req = true,
          collect_resp = true,
          resp = true,
          resp_body = true,
        }
      })
      mock:start()

      -- A BluePrint gives us a helpful database wrapper to
      --    manage Kong Gateway entities directly.
      -- This function also truncates any existing data in an existing db.
      -- The custom plugin name is provided to this function so it mark as loaded
      local blue_print = helpers.get_db_utils(strategy, nil, { PLUGIN_NAME })

      -- Add the custom plugin
      blue_print.plugins:insert {
        name = PLUGIN_NAME,
        config = {
          api_key = "test-api-key",
          proxy_endpoint = "http://0.0.0.0:" .. mock_port .. "/",
        }
      }

      -- Using the BluePrint to create a test route, automatically attaches it
      --    to the default "echo" service that will be created by the test framework
      local test_route = blue_print.routes:insert({
        paths = { "/mock" },
      })


      -- start kong
      assert(helpers.start_kong({
        -- use the custom test template to create a local mock server
        nginx_conf = "spec/fixtures/custom_nginx.template",
        -- make sure our plugin gets loaded
        plugins = "bundled," .. PLUGIN_NAME,
      }))

    end)

    -- teardown runs after its parent describe block
    teardown(function()
      helpers.stop_kong(nil, true)
      mock:stop(true)
    end)

    -- before_each runs before each child describe
    before_each(function()
      client = helpers.proxy_client()
    end)

    -- after_each runs after each child describe
    after_each(function()
      if client then client:close() end
    end)

    -- a nested describe defines an actual test on the plugin behavior
    describe("The response", function()

      it("does not error", function()
        -- invoke a test request
        local r = client:get("/mock/anything", {})
        assert.response(r).has.status(200)
        mock:wait_until_no_request()
      end)
    end)
  end)
end
