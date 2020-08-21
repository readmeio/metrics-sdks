require "readme/metrics"
require "rack/test"
require "webmock/rspec"

RSpec.describe Readme::Metrics do
  include Rack::Test::Methods

  it "has a version number" do
    expect(Readme::Metrics::VERSION).not_to be nil
  end

  context "in a multi-threaded environment" do
    it "doesn't wait for the HTTP request to Readme to finish" do
      readme_request_completion_time = 1 # seconds
      allow(HTTParty).to receive(:post) do
        sleep readme_request_completion_time
      end

      start_time = Time.now
      get "/api/foo"
      completion_time = Time.now - start_time

      expect(HTTParty).to have_received(:post).once
      expect(completion_time).to be < readme_request_completion_time
    end

    def app
      options = {api_key: "API_KEY", buffer_length: 1}
      app = Readme::Metrics.new(noop_app, options) { |env|
        {
          id: env["CURRENT_USER"].id,
          label: env["CURRENT_USER"].name,
          email: env["CURRENT_USER"].email
        }
      }
      app_with_http_version = SetHttpVersion.new(app)
      app_with_current_user = SetCurrentUser.new(app_with_http_version)
      app_with_current_user
    end
  end

  context "without batching" do
    before do
      stub_request(:post, Readme::Metrics::ENDPOINT)
      allow(Thread).to receive(:new).and_yield
    end

    it "doesn't modify the response" do
      post "/"

      response_without_middleware = noop_app.call(double)
      response_with_middleware = mock_response_to_raw(last_response)

      expect(response_with_middleware).to eq response_without_middleware
    end

    it "submits to the Readme API for POST requests with a JSON body" do
      header "Content-Type", "application/json"
      post "/api/foo", {key: "value"}.to_json

      expect(WebMock).to have_requested(:post, Readme::Metrics::ENDPOINT)
        .with { |request| validate_json("readmeMetrics", request.body) }
    end

    it "submits to the Readme API for POST requests with a url encoded body" do
      post "/api/foo", {key: "value"}

      expect(WebMock).to have_requested(:post, Readme::Metrics::ENDPOINT)
        .with { |request| validate_json("readmeMetrics", request.body) }
    end

    it "submits to the Readme API for POST requests with no body" do
      post "/api/foo"

      expect(WebMock).to have_requested(:post, Readme::Metrics::ENDPOINT)
        .with { |request| validate_json("readmeMetrics", request.body) }
    end

    it "submits to the Readme API for GET requests" do
      get "/api/foo"

      expect(WebMock).to have_requested(:post, Readme::Metrics::ENDPOINT)
        .with { |request| validate_json("readmeMetrics", request.body) }
    end

    it "submits to the Readme API for PUT requests with a JSON body" do
      header "Content-Type", "application/json"
      put "/api/foo", {key: "value"}.to_json

      expect(WebMock).to have_requested(:post, Readme::Metrics::ENDPOINT)
        .with { |request| validate_json("readmeMetrics", request.body) }
    end

    it "submits to the Readme API for PATCH requests with a JSON body" do
      header "Content-Type", "application/json"
      patch "/api/foo", {key: "value"}.to_json

      expect(WebMock).to have_requested(:post, Readme::Metrics::ENDPOINT)
        .with { |request| validate_json("readmeMetrics", request.body) }
    end

    it "submits to the Readme API for DELETE requests" do
      delete "/api/foo"

      expect(WebMock).to have_requested(:post, Readme::Metrics::ENDPOINT)
        .with { |request| validate_json("readmeMetrics", request.body) }
    end

    def app
      options = {api_key: "API KEY", development: true, buffer_length: 1}
      app = Readme::Metrics.new(noop_app, options) { |env|
        {
          id: env["CURRENT_USER"].id,
          label: env["CURRENT_USER"].name,
          email: env["CURRENT_USER"].email
        }
      }
      app_with_http_version = SetHttpVersion.new(app)
      app_with_current_user = SetCurrentUser.new(app_with_http_version)
      app_with_current_user
    end
  end

  context "with batching" do
    before do
      stub_request(:post, Readme::Metrics::ENDPOINT)
      allow(Thread).to receive(:new).and_yield
    end

    it "batches requests to the Readme API" do
      post "/api/foo"
      post "/api/bar"
      post "/api/baz"
      post "/api/biz"

      expect(WebMock).to have_requested(:post, Readme::Metrics::ENDPOINT)
        .with { |request| validate_json("readmeMetrics", request.body) }
        .twice
    end

    def app
      options = {api_key: "API KEY", development: true, buffer_length: 2}
      app = Readme::Metrics.new(noop_app, options) { |env|
        {
          id: env["CURRENT_USER"].id,
          label: env["CURRENT_USER"].name,
          email: env["CURRENT_USER"].email
        }
      }
      app_with_http_version = SetHttpVersion.new(app)
      app_with_current_user = SetCurrentUser.new(app_with_http_version)
      app_with_current_user
    end
  end

  describe "block validation" do
    it "raises when the block is missing" do
      options = {api_key: "key"}
      expect {
        Readme::Metrics.new(noop_app, options)
      }.to raise_error(
        Readme::Errors::ConfigurationError,
        Readme::Errors::MISSING_BLOCK_ERROR
      )
    end

    context "when the block returns a malformed hash" do
      def app
        options = {api_key: "API KEY"}
        Readme::Metrics.new(noop_app, options) { |env| {} }
      end

      it "logs an error" do
        expect { post "/api/foo" }
          .to output(/#{Readme::Errors.bad_block_message({})}/)
          .to_stdout
      end
    end
  end

  describe "option validation" do
    it "raises when the API key is missing" do
      options = {}
      expect {
        Readme::Metrics.new(noop_app, options)
      }.to raise_error(
        Readme::Errors::ConfigurationError,
        Readme::Errors::API_KEY_ERROR
      )
    end

    it "raises when the reject_params contains a non-string element" do
      options = {api_key: "key", reject_params: [:key]}
      expect {
        Readme::Metrics.new(noop_app, options)
      }.to raise_error(
        Readme::Errors::ConfigurationError,
        Readme::Errors::REJECT_PARAMS_ERROR
      )
    end

    it "raises when the allow_only contains a non-string element" do
      options = {api_key: "key", allow_only: [:key]}
      expect {
        Readme::Metrics.new(noop_app, options)
      }.to raise_error(
        Readme::Errors::ConfigurationError,
        Readme::Errors::ALLOW_ONLY_ERROR
      )
    end

    it "raises when buffer_length is not an integer" do
      options = {api_key: "key", buffer_length: "1"}
      expect {
        Readme::Metrics.new(noop_app, options)
      }.to raise_error(
        Readme::Errors::ConfigurationError,
        Readme::Errors::BUFFER_LENGTH_ERROR
      )
    end

    it "raises when development is not a boolean" do
      options = {api_key: "key", development: "true"}
      expect {
        Readme::Metrics.new(noop_app, options)
      }.to raise_error(
        Readme::Errors::ConfigurationError,
        Readme::Errors::DEVELOPMENT_ERROR
      )
    end

    it "raises when the logger does not respond to the correct messages" do
      options = {api_key: "key", logger: Class.new}
      expect {
        Readme::Metrics.new(noop_app, options)
      }.to raise_error(
        Readme::Errors::ConfigurationError,
        Readme::Errors::LOGGER_ERROR
      )
    end
  end

  def noop_app
    lambda do |env|
      [200, {"Content-Type" => "text/plain", "Content-Length" => "2"}, ["OK"]]
    end
  end

  def mock_response_to_raw(mock_response)
    [mock_response.status, mock_response.headers, [mock_response.body]]
  end

  # Rack::Test doesn't set the HTTP_VERSION header on requests, even though
  # real-world implementations of Rack servers do so. This middleware adds the
  # proper header to the env.
  class SetHttpVersion
    def initialize(app)
      @app = app
    end

    def call(env)
      new_env = env.merge({"HTTP_VERSION" => "HTTP/1.1"})
      @app.call(new_env)
    end
  end

  class SetCurrentUser
    def initialize(app)
      @app = app
    end

    def call(env)
      new_env = env.merge({"CURRENT_USER" => CurrentUser.new("1", "Test Testerson", "test@example.com")})
      @app.call(new_env)
    end
  end

  CurrentUser = Struct.new(:id, :name, :email)
end
