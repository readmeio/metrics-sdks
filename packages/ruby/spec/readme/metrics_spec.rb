require "rack/test"
require "webmock/rspec"

RSpec.describe Readme::Metrics do
  include Rack::Test::Methods

  before do
    stub_request(:post, Readme::Metrics::ENDPOINT)
  end

  it "has a version number" do
    expect(Readme::Metrics::VERSION).not_to be nil
  end

  it "doesn't modify the response" do
    post "/"

    response_without_middleware = noop_app.call(double)
    response_with_middleware = mock_response_to_raw(last_response)

    expect(response_with_middleware).to eq response_without_middleware
  end

  it "posts request urls to Readme API" do
    post "/api/foo"
    post "/api/bar"

    expect(WebMock).to have_requested(:post, Readme::Metrics::ENDPOINT)
      .with { |request| validate_json("readmeMetrics", request.body) }
      .twice
  end

  def app
    SetHttpVersion.new(Readme::Metrics.new(noop_app, "API_KEY"))
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
end
