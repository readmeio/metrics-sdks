require "spec_helper"
require "http_request"

RSpec.describe HttpRequest do
  describe "#url" do
    it "builds a URL from parts" do
      env = {
        "PATH_INFO" => "/foo/bar",
        "REQUEST_METHOD" => "POST",
        "QUERY_STRING" => "id=1&name=joel",
        "SERVER_NAME" => "localhost",
        "SERVER_PORT" => "8080",
        "rack.url_scheme" => "http"
      }
      request = HttpRequest.new(env)

      expect(request.url).to eq "http://localhost:8080/foo/bar?id=1&name=joel"
    end

    it "takes into account the Rack SCRIPT_NAME parameter" do
      env = {
        "PATH_INFO" => "/foo/bar",
        "REQUEST_METHOD" => "POST",
        "QUERY_STRING" => "id=1&name=joel",
        "SCRIPT_NAME" => "/api",
        "SERVER_NAME" => "localhost",
        "SERVER_PORT" => "8080",
        "rack.url_scheme" => "http"
      }
      request = HttpRequest.new(env)

      expect(request.url).to eq "http://localhost:8080/api/foo/bar?id=1&name=joel"
    end
  end

  describe "#cookies" do
    it "builds a hash from the Rack HTTP_COOKIE key" do
      env = {"HTTP_COOKIE" => "cookie1=value1; cookie2=value2"}
      request = HttpRequest.new(env)

      expect(request.cookies).to eq({"cookie1" => "value1", "cookie2" => "value2"})
    end

    it "is an empty hash when the Rack HTTP_COOKIE key is not present" do
      request = HttpRequest.new({})

      expect(request.cookies).to be_empty
    end
  end

  describe "#query_params" do
    it "builds a hash of strings from the Rack QUERY_STRING key" do
      env = {"QUERY_STRING" => "id=1&name=joel"}
      request = HttpRequest.new(env)

      expect(request.query_params).to eq({"id" => "1", "name" => "joel"})
    end

    it "is an empty hash when the Rack QUERY_STRING key is not present" do
      request = HttpRequest.new({})

      expect(request.query_params).to be_empty
    end
  end

  describe "#http_version" do
    it "gets the version from the proper Rack header" do
      env = {"HTTP_VERSION" => "HTTP/1.1"}
      request = HttpRequest.new(env)

      expect(request.http_version).to eq "HTTP/1.1"
    end

    it "is nil when the header is missing" do
      request = HttpRequest.new({})

      expect(request.http_version).to be_nil
    end
  end

  describe "#request_method" do
    it "gets the value from the Rack REQUEST_METHOD key" do
      request = HttpRequest.new("REQUEST_METHOD" => "POST")

      expect(request.request_method).to eq "POST"
    end
  end

  describe "#content_type" do
    it "gets the the value from the Rack CONTENT_TYPE key" do
      request = HttpRequest.new("CONTENT_TYPE" => "application/json")

      expect(request.content_type).to eq "application/json"
    end
  end

  describe "#content_length" do
    it "gets the the value from the Rack CONTENT_LENGTH key" do
      request = HttpRequest.new("CONTENT_LENGTH" => "256")

      expect(request.content_length).to eq 256
    end

    it "is zero when the Rack CONTENT_LENGTH isn't set" do
      request = HttpRequest.new({})

      expect(request.content_length).to eq 0
    end
  end

  describe "#headers" do
    it "is the normalized Rack HTTP_ keys minus a few non-header ones" do
      env = {
        "HTTP_COOKIE" => "cookie1=value1; cookie2=value2",
        "HTTP_VERSION" => "HTTP/1.1",
        "HTTP_X_CUSTOM" => "custom",
        "HTTP_ACCEPT" => "text/plain",
        "HTTP_PORT" => "8080",
        "HTTP_HOST" => "example.com"
      }
      request = HttpRequest.new(env)

      expect(request.headers).to eq({"X-Custom" => "custom", "Accept" => "text/plain"})
    end
  end

  describe "#body" do
    it "reads the body from the rack.input key" do
      env = {
        "rack.input" => Rack::Lint::InputWrapper.new(StringIO.new("[BODY]"))
      }
      request = HttpRequest.new(env)

      expect(request.body).to eq "[BODY]"
    end

    it "can be read safely multiple times" do
      env = {
        "rack.input" => Rack::Lint::InputWrapper.new(StringIO.new("[BODY]"))
      }
      request = HttpRequest.new(env)

      expect(request.body).to eq "[BODY]"
      expect(request.body).to eq "[BODY]"
    end
  end
end
