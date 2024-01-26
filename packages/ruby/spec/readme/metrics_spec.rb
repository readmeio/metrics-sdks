require 'readme/metrics'
require 'rack/test'
require 'webmock/rspec'
require 'securerandom'

# rubocop:disable Lint/UnusedMethodArgument
class JsonApp
  def call(env)
    if Readme::HttpRequest::IS_RACK_V3
      [
        200,
        { 'content-type' => 'application/json', 'content-length' => '15' },
        [{ key: 'value' }.to_json]
      ]
    else
      [
        200,
        { 'Content-Type' => 'application/json', 'Content-Length' => '15' },
        [{ key: 'value' }.to_json]
      ]
    end
  end
end

class TextApp
  def call(env)
    [200, { 'Content-Type' => 'text/plain', 'Content-Length' => '2' }, ['OK']]
  end
end

class EmptyApp
  def call(env)
    [204, {}, []]
  end
end
# rubocop:enable Lint/UnusedMethodArgument

# Rack::Test doesn't set the SERVER_PROTOCOL header on requests, even though
# real-world implementations of Rack servers do so. This middleware adds the
# proper header to the env.
class SetHttpVersion
  def initialize(app)
    @app = app
  end

  def call(env)
    new_env = if Readme::HttpRequest::IS_RACK_V3
                env.merge({ 'SERVER_PROTOCOL' => 'HTTP/1.1' })
              else
                env.merge({ 'HTTP_VERSION' => 'HTTP/1.1' })
              end

    @app.call(new_env)
  end
end

class SetCurrentUser
  def initialize(app)
    @app = app
  end

  def call(env)
    new_env = env.merge({ 'CURRENT_USER' => CurrentUser.new('1', 'Test Testerson', 'test@example.com') })
    @app.call(new_env)
  end
end

CurrentUser = Struct.new(:id, :name, :email)

RSpec.describe Readme::Metrics do
  include Rack::Test::Methods

  before do
    WebMock.reset_executed_requests!
  end

  it 'has a version number' do
    expect(Readme::Metrics::VERSION).not_to be_nil
  end

  context 'when provided a custom request queue' do
    let(:request_queue) { [] }

    def app
      empty_app_with_middleware({ request_queue: request_queue })
    end

    it 'pushes to the custom queue' do
      post '/api/foo', '[BODY]'

      expect(request_queue.size).to eq 1
    end
  end

  context 'when in a multi-threaded environment' do
    it "doesn't wait for the HTTP request to Readme to finish" do
      readme_request_completion_time = 1 # seconds
      allow(HTTParty).to receive(:post) do
        sleep readme_request_completion_time
      end

      start_time = Time.now
      get '/api/foo'
      completion_time = Time.now - start_time

      expect(completion_time).to be < readme_request_completion_time
    end

    def app
      json_app_with_middleware(buffer_length: 1)
    end
  end

  context 'without batching' do
    before do
      stub_request(:post, Readme::Metrics::ENDPOINT)
      allow(Thread).to receive(:new).and_yield
    end

    it "doesn't modify the response" do
      post '/'

      response_without_middleware = noop_app.call(double)
      response_with_middleware = mock_response_to_raw(last_response)

      expect(response_with_middleware).to eq response_without_middleware
    end

    it 'submits to the Readme API for POST requests with a JSON body' do
      header 'Content-Type', 'application/json'
      post '/api/foo', { key: 'value' }.to_json

      expect(a_request(:post, Readme::Metrics::ENDPOINT)
        .with { |request| validate_json('readmeMetrics', request.body) })
        .to have_been_made.at_least_once
    end

    it 'submits to the Readme API for POST requests with a url encoded body' do
      post '/api/foo', { key: 'value' }

      expect(a_request(:post, Readme::Metrics::ENDPOINT)
        .with { |request| validate_json('readmeMetrics', request.body) })
        .to have_been_made.at_least_once
    end

    it 'submits to the Readme API for POST requests with no body' do
      post '/api/foo'

      expect(a_request(:post, Readme::Metrics::ENDPOINT)
        .with { |request| validate_json('readmeMetrics', request.body) })
        .to have_been_made.at_least_once
    end

    it 'submits to the Readme API for GET requests' do
      get '/api/foo'

      expect(a_request(:post, Readme::Metrics::ENDPOINT)
        .with { |request| validate_json('readmeMetrics', request.body) })
        .to have_been_made.at_least_once
    end

    it 'submits to the Readme API for PUT requests with a JSON body' do
      header 'Content-Type', 'application/json'
      put '/api/foo', { key: 'value' }.to_json

      expect(a_request(:post, Readme::Metrics::ENDPOINT)
        .with { |request| validate_json('readmeMetrics', request.body) })
        .to have_been_made.at_least_once
    end

    it 'submits to the Readme API for PATCH requests with a JSON body' do
      header 'Content-Type', 'application/json'
      patch '/api/foo', { key: 'value' }.to_json

      expect(a_request(:post, Readme::Metrics::ENDPOINT)
        .with { |request| validate_json('readmeMetrics', request.body) })
        .to have_been_made.at_least_once
    end

    it 'submits to the Readme API for DELETE requests' do
      delete '/api/foo'

      expect(a_request(:post, Readme::Metrics::ENDPOINT)
        .with { |request| validate_json('readmeMetrics', request.body) })
        .to have_been_made.at_least_once
    end

    it 'returns a response when the middleware raises an error' do
      allow_any_instance_of(described_class).to receive(:process_response).and_raise

      post '/api/foo'

      expect(last_response.status).to eq 200
    end

    it 'returns a response when the Payload raises an error' do
      allow(Readme::Payload).to receive(:new).and_raise

      post '/api/foo'

      expect(last_response.status).to eq 200
    end

    it 'returns a response when the Har::Serializer raises an error' do
      allow(Readme::Har::Serializer).to receive(:new).and_raise

      post '/api/foo'

      expect(last_response.status).to eq 200
    end

    it 'returns a response when the RequestQueue raises an error' do
      allow_any_instance_of(Readme::RequestQueue).to receive(:push).and_raise

      post '/api/foo'

      expect(last_response.status).to eq 200
    end

    it "doesn't send a request to Readme with an OPTIONS request" do
      options 'api/foo'

      expect(WebMock).not_to have_requested(:post, Readme::Metrics::ENDPOINT)
      expect(last_response.status).to eq 200
    end

    def app
      json_app_with_middleware(buffer_length: 1)
    end
  end

  describe 'unsupported request bodies' do
    before do
      stub_request(:post, Readme::Metrics::ENDPOINT)
      allow(Thread).to receive(:new).and_yield
    end

    it 'is not submitted to Readme with a reject configured' do
      def app
        json_app_with_middleware(buffer_length: 1, reject_params: ['reject'])
      end

      header 'Content-Type', 'text/plain'
      post '/api/foo', '[BODY]'

      expect(WebMock).not_to have_requested(:post, Readme::Metrics::ENDPOINT)
      expect(last_response.status).to eq 200
    end

    it 'is not submitted to Readme with allow-only configured' do
      def app
        json_app_with_middleware(buffer_length: 1, allow_only: ['allowed'])
      end

      header 'Content-Type', 'text/plain'
      post '/api/foo', '[BODY]'

      expect(WebMock).not_to have_requested(:post, Readme::Metrics::ENDPOINT)
      expect(last_response.status).to eq 200
    end

    it 'is submitted to Readme with no filter configured' do
      def app
        json_app_with_middleware(buffer_length: 1)
      end

      header 'Content-Type', 'text/plain'
      post '/api/foo', '[BODY]'

      expect(WebMock).to have_requested(:post, Readme::Metrics::ENDPOINT)
      expect(last_response.status).to eq 200
    end

    it 'is submitted to Readme when the body is empty with allow-only configured' do
      def app
        json_app_with_middleware(buffer_length: 1, allow_only: ['allowed'])
      end

      get '/api/foo'

      expect(WebMock).to have_requested(:post, Readme::Metrics::ENDPOINT)
      expect(last_response.status).to eq 200
    end

    it 'is submitted to Readme when the body is empty with reject_params configured' do
      def app
        json_app_with_middleware(buffer_length: 1, reject_params: ['reject'])
      end

      get '/api/foo'

      expect(WebMock).to have_requested(:post, Readme::Metrics::ENDPOINT)
      expect(last_response.status).to eq 200
    end
  end

  describe 'unsupported response bodies' do
    before do
      stub_request(:post, Readme::Metrics::ENDPOINT)
      allow(Thread).to receive(:new).and_yield
    end

    it 'is submitted to Readme with no filter configured' do
      def app
        text_app_with_middleware(buffer_length: 1)
      end

      post '/api/foo'

      expect(WebMock).to have_requested(:post, Readme::Metrics::ENDPOINT)
      expect(last_response.status).to eq 200
    end

    it 'is not submitted to Readme with an allow-only configured' do
      def app
        text_app_with_middleware(buffer_length: 1, allow_only: ['allowed'])
      end

      post '/api/foo'

      expect(WebMock).not_to have_requested(:post, Readme::Metrics::ENDPOINT)
      expect(last_response.status).to eq 200
    end

    it 'is not submitted to Readme with reject_params configured' do
      def app
        text_app_with_middleware(buffer_length: 1, reject_params: ['reject'])
      end

      post '/api/foo'

      expect(WebMock).not_to have_requested(:post, Readme::Metrics::ENDPOINT)
      expect(last_response.status).to eq 200
    end

    it 'is submitted to Readme with reject_params configured for empty bodies' do
      def app
        empty_app_with_middleware(buffer_length: 1, reject_params: ['reject'])
      end

      post '/api/foo'

      expect(WebMock).to have_requested(:post, Readme::Metrics::ENDPOINT)
      expect(last_response.status).to eq 204
    end

    it 'is submitted to Readme with allow_only configured for empty bodies' do
      def app
        empty_app_with_middleware(buffer_length: 1, allow_only: ['allowed'])
      end

      post '/api/foo'

      expect(WebMock).to have_requested(:post, Readme::Metrics::ENDPOINT)
      expect(last_response.status).to eq 204
    end
  end

  context 'with batching' do
    before do
      stub_request(:post, Readme::Metrics::ENDPOINT)
      allow(Thread).to receive(:new).and_yield
    end

    it 'batches requests to the Readme API' do
      post '/api/foo'
      post '/api/bar'
      post '/api/baz'
      post '/api/biz'

      expect(WebMock).to have_requested(:post, Readme::Metrics::ENDPOINT)
        .with { |request| validate_json('readmeMetrics', request.body) }
        .twice
    end

    def app
      json_app_with_middleware(buffer_length: 2)
    end
  end

  describe 'block validation' do
    it 'raises when the block is missing' do
      options = { api_key: 'key' }
      expect {
        described_class.new(noop_app, options)
      }.to raise_error(
        Readme::Errors::ConfigurationError,
        Readme::Errors::MISSING_BLOCK_ERROR
      )
    end

    context 'when the block returns a malformed hash' do
      def app
        options = { api_key: 'API KEY' }
        Readme::Metrics.new(noop_app, options) { {} }
      end

      it 'logs an error' do
        expect { post '/api/foo' }
          .to output(/#{Readme::Errors.bad_block_message({})}/)
          .to_stdout
      end
    end
  end

  describe 'option validation' do
    it 'raises when the API key is missing' do
      options = {}
      expect {
        described_class.new(noop_app, options)
      }.to raise_error(
        Readme::Errors::ConfigurationError,
        Readme::Errors::API_KEY_ERROR
      )
    end

    it 'raises when the reject_params contains a non-string element' do
      options = { api_key: 'key', reject_params: [:key] }
      expect {
        described_class.new(noop_app, options)
      }.to raise_error(
        Readme::Errors::ConfigurationError,
        Readme::Errors::REJECT_PARAMS_ERROR
      )
    end

    it 'raises when the allow_only contains a non-string element' do
      options = { api_key: 'key', allow_only: [:key] }
      expect {
        described_class.new(noop_app, options)
      }.to raise_error(
        Readme::Errors::ConfigurationError,
        Readme::Errors::ALLOW_ONLY_ERROR
      )
    end

    it 'raises when buffer_length is not an integer' do
      options = { api_key: 'key', buffer_length: '1' }
      expect {
        described_class.new(noop_app, options)
      }.to raise_error(
        Readme::Errors::ConfigurationError,
        Readme::Errors::BUFFER_LENGTH_ERROR
      )
    end

    it 'raises when development is not a boolean' do
      options = { api_key: 'key', development: 'true' }
      expect {
        described_class.new(noop_app, options)
      }.to raise_error(
        Readme::Errors::ConfigurationError,
        Readme::Errors::DEVELOPMENT_ERROR
      )
    end

    it 'raises when the logger does not respond to the correct messages' do
      options = { api_key: 'key', logger: Class.new }
      expect {
        described_class.new(noop_app, options)
      }.to raise_error(
        Readme::Errors::ConfigurationError,
        Readme::Errors::LOGGER_ERROR
      )
    end
  end

  describe 'group validation' do
    before do
      stub_request(:post, Readme::Metrics::ENDPOINT)
      allow(Thread).to receive(:new).and_yield
    end

    it 'supports the api_key field in lieu of the deprecated id field' do
      def app
        json_app_with_middleware({}, { id: :empty, api_key: '8675309' })
      end

      post '/api/foo'

      expect(WebMock).to(have_requested(:post, Readme::Metrics::ENDPOINT)
        .with { |request| validate_json('readmeMetrics', request.body) })
    end

    it 'can ignore sending logs' do
      def app
        json_app_with_middleware({}, { ignore: true })
      end

      post '/api/foo'

      expect(WebMock).not_to have_requested(:post, Readme::Metrics::ENDPOINT)
    end
  end

  def json_app_with_middleware(option_overrides = {}, group_overrides = {})
    app_with_middleware(JsonApp.new, option_overrides, group_overrides)
  end

  def text_app_with_middleware(option_overrides = {}, group_overrides = {})
    app_with_middleware(TextApp.new, option_overrides, group_overrides)
  end

  def empty_app_with_middleware(option_overrides = {}, group_overrides = {})
    app_with_middleware(EmptyApp.new, option_overrides, group_overrides)
  end

  def app_with_middleware(app, option_overrides = {}, group_overrides = {})
    defaults = { api_key: 'API KEY', buffer_length: 1 }
    with_metrics = Readme::Metrics.new(app, defaults.merge(option_overrides)) { |env|
      group = {
        id: env['CURRENT_USER'].id,
        label: env['CURRENT_USER'].name,
        email: env['CURRENT_USER'].email,
        log_id: SecureRandom.uuid,
        ignore: false
      }.merge(group_overrides)
      group.delete :id unless group[:api_key].nil?
      group
    }

    SetCurrentUser.new(SetHttpVersion.new(with_metrics))
  end

  def noop_app
    JsonApp.new
  end

  def mock_response_to_raw(mock_response)
    [mock_response.status, mock_response.headers, [mock_response.body]]
  end
end
