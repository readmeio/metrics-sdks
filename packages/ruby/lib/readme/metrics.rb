require "readme/metrics/version"
require "httparty"

module Readme
  class Metrics
    ENDPOINT = "https://metrics.readme.io/v1/request"

    def initialize(app, api_key)
      @app = app
      @api_key = api_key
    end

    def call(env)
      json = File.read(File.expand_path("../../data.json", __FILE__))
      HTTParty.post(
        ENDPOINT,
        basic_auth: {username: @api_key, password: ""},
        headers: {"Content-Type" => "application/json"},
        body: json
      )
      @app.call(env)
    end
  end
end
