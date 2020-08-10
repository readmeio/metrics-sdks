require "readme/metrics/version"
require "httparty"

module Readme
  class Metrics
    def initialize(app, endpoint)
      @app = app
      @endpoint = endpoint
    end

    def call(env)
      path = "#{env["REQUEST_METHOD"]} #{env["PATH_INFO"]}"
      HTTParty.post(@endpoint, body: {path: path}.to_json)
      @app.call(env)
    end
  end
end
