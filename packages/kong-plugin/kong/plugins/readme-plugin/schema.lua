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
                          description = "Select header to be used as a unique identifier for a user. This value will be hashed by ReadMe. Authorization header is used by default. If header was not found, it will be set to 'Unknown'.",
                          type = "string",
                          default = "Authorization"
                      }
                    },
                    {
                        proxy_endpoint = typedefs.url(
                            {
                                description = "An optional endpoint to send reqeust to. If you are proxying ensure final endpoint is https://metrics.readme.io/v1/request."
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
                            description = "An optional table of headers to exclude from logging. Header will be set to supplied value. If values set to an empty string will be ignored. applies to both requests and responses.",
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
                            description = "A map of headers to group by. The key is the header name and value is the header value to group by. Applies to both request headers only. If header is not found, it will be set to 'unknown'. email and label are recommened.",
                            type = "map",
                            keys = typedefs.header_name,
                            values = {
                                type = "string",
                                match_none = {
                                  {
                                    pattern = "^id$",
                                    err = "cannot map to 'id'",
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
