local typedefs = require "kong.db.schema.typedefs"
local url = require "socket.url"

return {
    name = "readme-plugin",
    fields = {
        {protocols = typedefs.protocols},
        {
            config = {
                type = "record",
                fields = {
                    {
                      api_key = {
                        required = true,
                        description = "ReadMe API key.",
                        type = "string"
                      }
                    },
                    {
                      id_header = {
                          description = "Select header to be used as a unique identifier for a user. This value will be hashed by ReadMe. The `Authorization` header is used by default. If the configured header was not found then it will be set to `none`.",
                          type = "string",
                          default = "Authorization"
                      }
                    },
                    {
                        proxy_endpoint = typedefs.url(
                            {
                                description = "An optional endpoint to send the request to. If you are proxying, ensure the final endpoint is `https://metrics.readme.io/v1/request`."
                            }
                        )
                    },
                    {
                        timeout = {
                            description = "An optional timeout in milliseconds when sending data to the upstream server.",
                            type = "number",
                            default = 10000
                        }
                    },
                    {
                        keepalive = {
                            description = "An optional value in milliseconds that defines how long an idle connection will live before being closed.",
                            type = "number",
                            default = 60000
                        }
                    },
                    {
                        hide_headers = {
                            description = "An optional table of headers to exclude from logging. The header will be set to supplied value. If the supplised value is an empty string, the header will be excluded from logging. This applies to both requests and responses.",
                            type = "map",
                            keys = {
                                type = "string"
                            },
                            values = {
                                type = "string",
                                len_min = 0,
                            },
                            default = {}
                        }
                    },
                    {
                        group_by = {
                            description = "A map of headers to group by. The key is the header name and the value is the header value to group by. Applies to request headers only. If the header is not found, it will be set to `none`. `email` and `label` are recommended keys to provide.",
                            type = "map",
                            keys = typedefs.header_name,
                            values = {
                                type = "string",
                                match_none = {
                                  {
                                    pattern = "^id$",
                                    err = "cannot map to `id`",
                                  }
                                }
                            }
                        }
                    },
                    {queue = typedefs.queue},
                }
            }
        }
    }
}
