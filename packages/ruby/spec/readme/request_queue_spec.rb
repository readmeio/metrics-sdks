require "readme/request_queue"
require "webmock/rspec"

RSpec.describe Readme::RequestQueue do
  before do
    allow(Thread).to receive(:new).and_yield
  end

  describe "#push" do
    it "adds a value to the queue" do
      queue = Readme::RequestQueue.new("key", 10)
      queue.push("value")
      queue.push("other_value")

      expect(queue.queue).to eq ["value", "other_value"]
    end

    it "does not send a request until the queue is long enough" do
      stub_request(:post, Readme::Metrics::ENDPOINT)

      queue = Readme::RequestQueue.new("key", 2)
      queue.push("value")

      expect(WebMock).to_not have_requested(:post, Readme::Metrics::ENDPOINT)
    end

    context "when the queue is long enough to be sent" do
      before do
        stub_request(:post, Readme::Metrics::ENDPOINT)
      end

      it "sends a request" do
        queue = Readme::RequestQueue.new("key", 2)
        queue.push("value")
        queue.push("other_value")

        expect(WebMock).to have_requested(:post, Readme::Metrics::ENDPOINT)
          .with { |request| request.body == "[value, other_value]" }
      end

      it "pulls off the appropriate number of items from the queue" do
        queue = Readme::RequestQueue.new("key", 2)
        queue.push("value")
        queue.push("other_value")
        queue.push("leftover")

        expect(queue.queue).to eq ["leftover"]
      end
    end
  end
end
