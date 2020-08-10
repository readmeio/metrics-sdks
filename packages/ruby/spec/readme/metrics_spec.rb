require "rack/test"
require "webmock/rspec"

RSpec.describe Readme::Metrics do
  include Rack::Test::Methods

  before do
    stub_request(:post, readme_endpoint)
  end

  it "has a version number" do
    expect(Readme::Metrics::VERSION).not_to be nil
  end

  it "doesn't modify the response" do
    get "/"

    response_without_middleware = noop_app.call(double)
    response_with_middleware = mock_response_to_raw(last_response)

    expect(response_with_middleware).to eq response_without_middleware
  end

  it "posts request urls to Readme API" do
    get "/api/foo"
    post "/api/bar"

    expect(WebMock).to have_requested(:post, readme_endpoint)
      .with(body: {path: "GET /api/foo"}.to_json)

    expect(WebMock).to have_requested(:post, readme_endpoint)
      .with(body: {path: "POST /api/bar"}.to_json)
  end

  def readme_endpoint
    "http://example.com/"
  end

  def app
    Readme::Metrics.new(noop_app, readme_endpoint)
  end

  def noop_app
    lambda do |env|
      [200, {"Content-Type" => "text/plain"}, ["OK"]]
    end
  end

  def mock_response_to_raw(mock_response)
    [mock_response.status, mock_response.headers, [mock_response.body]]
  end
end
