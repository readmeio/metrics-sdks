module Readme
  class RequestQueue
    attr_reader :queue

    def initialize(buffer_length)
      @queue = []
      @buffer_length = buffer_length
    end

    def push(request)
      @queue << request

      if ready_to_send?
        payloads = @queue.slice!(0, @buffer_length)

        HTTParty.post(
          Readme::Metrics::ENDPOINT,
          basic_auth: {username: @api_key, password: ""},
          headers: {"Content-Type" => "application/json"},
          body: to_json(payloads)
        )
      end
    end

    private

    def ready_to_send?
      @queue.length >= @buffer_length
    end

    def to_json(payloads)
      "[#{payloads.join(", ")}]"
    end
  end
end
