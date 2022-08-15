require 'readme/metrics'

module Readme
  class RequestQueue
    def initialize(api_key, buffer_length)
      @queue = []
      @buffer_length = buffer_length
      @api_key = api_key
      @lock = Mutex.new
    end

    def push(request)
      @lock.synchronize do
        @queue << request

        if ready_to_send?
          payloads = @queue.slice!(0, @buffer_length)
          send_payloads(payloads)
        end
      end
    end

    def length
      @queue.length
    end

    private

    def send_payloads(payloads)
      Thread.new do
        HTTParty.post(
          Readme::Metrics::ENDPOINT,
          basic_auth: { username: @api_key, password: '' },
          headers: { 'Content-Type' => 'application/json' },
          body: to_json(payloads)
        )
      end
    end

    def ready_to_send?
      length >= @buffer_length
    end

    def to_json(payloads)
      "[#{payloads.join(', ')}]"
    end
  end
end
