# frozen_string_literal: true

module Readme
  class Errors
    API_KEY_ERROR = 'Missing API Key'
    REJECT_PARAMS_ERROR = 'The `reject_params` option must be an array of strings'
    ALLOW_ONLY_ERROR = 'The `allow_only` option must be an array of strings'
    BUFFER_LENGTH_ERROR = 'The `buffer_length` must be an Integer'
    DEVELOPMENT_ERROR = 'The `development` option must be a boolean'
    LOGGER_ERROR = <<~MESSAGE
      The `logger` option must be class that responds to the following messages:
        :unkown, :fatal, :error, :warn, :info, :debug, :level
    MESSAGE

    MISSING_BLOCK_ERROR = <<~MESSAGE
      Missing block argument. You must provide a block when configuring the
      middleware. The block must return a hash containing user info:
        use Readme::Metrics, options do |env|
          { id: "unique_id", label: "Your user label", email: "Your user email" }
        end
    MESSAGE

    def self.bad_block_message(result)
      <<~MESSAGE
        The request could not be sent to Readme. Something went wrong when
        setting user info. Double check the block configured on the ReadMe
        middleware.

        Expected a hash with the shape:
          { api_key: "Your user api key", label: "Your user label", email: "Your user email" }

        Received value:
          #{result}
      MESSAGE
    end

    class ConfigurationError < StandardError; end
  end
end
