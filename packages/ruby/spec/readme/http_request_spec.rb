require 'readme/http_request'
require 'readme/mask'

RSpec.describe Readme::HttpRequest do
  describe '#url' do
    it 'builds a URL from parts' do
      env = {
        'PATH_INFO' => '/foo/bar',
        'REQUEST_METHOD' => 'POST',
        'QUERY_STRING' => 'id=1&name=joel',
        'SERVER_NAME' => 'localhost',
        'SERVER_PORT' => '8080',
        'rack.url_scheme' => 'http'
      }
      request = described_class.new(env)

      expect(request.url).to eq 'http://localhost:8080/foo/bar?id=1&name=joel'
    end

    it 'takes into account the Rack SCRIPT_NAME parameter' do
      env = {
        'PATH_INFO' => '/foo/bar',
        'REQUEST_METHOD' => 'POST',
        'QUERY_STRING' => 'id=1&name=joel',
        'SCRIPT_NAME' => '/api',
        'SERVER_NAME' => 'localhost',
        'SERVER_PORT' => '8080',
        'rack.url_scheme' => 'http'
      }
      request = described_class.new(env)

      expect(request.url).to eq 'http://localhost:8080/api/foo/bar?id=1&name=joel'
    end
  end

  describe '#cookies' do
    it 'builds a hash from the Rack HTTP_COOKIE key' do
      env = { 'HTTP_COOKIE' => 'cookie1=value1; cookie2=value2' }
      request = described_class.new(env)

      expect(request.cookies).to eq({ 'cookie1' => 'value1', 'cookie2' => 'value2' })
    end

    it 'is an empty hash when the Rack HTTP_COOKIE key is not present' do
      request = described_class.new({})

      expect(request.cookies).to be_empty
    end
  end

  describe '#query_params' do
    it 'builds a hash of strings from the Rack QUERY_STRING key' do
      env = { 'QUERY_STRING' => 'id=1&name=joel' }
      request = described_class.new(env)

      expect(request.query_params).to eq({ 'id' => '1', 'name' => 'joel' })
    end

    it 'is an empty hash when the Rack QUERY_STRING key is not present' do
      request = described_class.new({})

      expect(request.query_params).to be_empty
    end
  end

  describe '#http_version' do
    it 'gets the version from the proper Rack header' do
      env = if Readme::HttpRequest::IS_RACK_V3
              { 'SERVER_PROTOCOL' => 'HTTP/1.1' }
            else
              { 'HTTP_VERSION' => 'HTTP/1.1' }
            end
      request = described_class.new(env)

      expect(request.http_version).to eq 'HTTP/1.1'
    end

    it 'is nil when the header is missing' do
      request = described_class.new({})

      expect(request.http_version).to be_nil
    end
  end

  describe '#request_method' do
    it 'gets the value from the Rack REQUEST_METHOD key' do
      request = described_class.new('REQUEST_METHOD' => 'POST')

      expect(request.request_method).to eq 'POST'
    end
  end

  describe '#content_type' do
    it 'gets the the value from the Rack CONTENT_TYPE key' do
      request = described_class.new('CONTENT_TYPE' => 'application/json')

      expect(request.content_type).to eq 'application/json'
    end
  end

  describe '#form_data?' do
    it 'is true for `application/x-www-form-urlencoded`' do
      request = described_class.new(
        'CONTENT_TYPE' => 'application/x-www-form-urlencoded'
      )

      expect(request).to be_form_data
    end

    it 'is true for `multipart/form-data`' do
      request = described_class.new('CONTENT_TYPE' => 'multipart/form-data')

      expect(request).to be_form_data
    end

    it 'is false for other MIME types' do
      request = described_class.new('CONTENT_TYPE' => 'application/json')

      expect(request).not_to be_form_data
    end
  end

  describe '#content_length' do
    it 'gets the the value from the Rack CONTENT_LENGTH key' do
      request = described_class.new('CONTENT_LENGTH' => '256')

      expect(request.content_length).to eq 256
    end

    it "is zero when the Rack CONTENT_LENGTH isn't set" do
      request = described_class.new({})

      expect(request.content_length).to eq 0
    end
  end

  describe '#headers' do
    it 'is the normalized Rack HTTP_ keys minus a few non-header ones plus content type and length' do
      env = {
        'HTTP_COOKIE' => 'cookie1=value1; cookie2=value2',
        'HTTP_X_CUSTOM' => 'custom',
        'HTTP_ACCEPT' => 'text/plain',
        'HTTP_PORT' => '8080',
        'HTTP_HOST' => 'example.com',
        'CONTENT_TYPE' => 'application/json',
        'CONTENT_LENGTH' => '10'
      }

      env['HTTP_VERSION'] = 'HTTP/1.1' unless Readme::HttpRequest::IS_RACK_V3

      request = described_class.new(env)

      expect(request.headers).to eq(
        {
          'Host' => 'example.com',
          'X-Custom' => 'custom',
          'Accept' => 'text/plain',
          'Content-Type' => 'application/json',
          'Content-Length' => '10'
        }
      )
    end

    it 'properly sanitizes authorization headers' do
      env = {
        'HTTP_AUTHORIZATION' => 'Basic xxx:aaa'
      }

      env['HTTP_VERSION'] = 'HTTP/1.1' unless Readme::HttpRequest::IS_RACK_V3

      request = described_class.new(env)

      expect(request.headers).to eq(
        {
          'Authorization' => Readme::Mask.mask('Basic xxx:aaa')
        }
      )
    end

    it 'matches the hashing output of the node.js SDK' do
      env = {
        'HTTP_AUTHORIZATION' => 'Bearer: a-random-api-key'
      }

      env['HTTP_VERSION'] = 'HTTP/1.1' unless Readme::HttpRequest::IS_RACK_V3

      request = described_class.new(env)

      expect(request.headers).to eq(
        {
          'Authorization' => 'sha512-7S+L0vUE8Fn6HI3836rtz4b6fVf6H4JFur6SGkOnL3bFpC856+OSZkpIHphZ0ipNO+kUw1ePb5df2iYrNQCpXw==?-key'
        }
      )
    end
  end

  describe '#body' do
    it 'reads the body from the rack.input key' do
      env = if Readme::HttpRequest::IS_RACK_V3
              {
                'rack.input' => Rack::Lint::Wrapper::InputWrapper.new(StringIO.new('[BODY]'))
              }
            else
              {
                'rack.input' => Rack::Lint::InputWrapper.new(StringIO.new('[BODY]'))
              }
            end

      request = described_class.new(env)

      expect(request.body).to eq '[BODY]'
    end

    it 'can be read safely multiple times' do
      env = if Readme::HttpRequest::IS_RACK_V3
              {
                'rack.input' => Rack::Lint::Wrapper::InputWrapper.new(StringIO.new('[BODY]'))
              }
            else
              {
                'rack.input' => Rack::Lint::InputWrapper.new(StringIO.new('[BODY]'))
              }
            end
      request = described_class.new(env)

      expect(request.body).to eq '[BODY]'
      expect(request.body).to eq '[BODY]'
    end

    it 'returns an empty string if an error occurs while reading the body' do
      io = instance_double(StringIO, read: nil)
      allow(io).to receive(:rewind).and_raise(StandardError.new('Test Error'))

      env = { 'rack.input' => io }
      request = described_class.new(env)

      expect(request.body).to eq ''
    end
  end

  describe '#parsed_form_data' do
    it 'returns the parsed form-encoded body as a hash' do
      env = if Readme::HttpRequest::IS_RACK_V3
              {
                'CONTENT_TYPE' => 'application/x-www-form-urlencoded',
                'rack.input' => Rack::Lint::Wrapper::InputWrapper.new(StringIO.new('first=1&second=2'))
              }
            else
              {
                'CONTENT_TYPE' => 'application/x-www-form-urlencoded',
                'rack.input' => Rack::Lint::InputWrapper.new(StringIO.new('first=1&second=2'))
              }
            end

      request = described_class.new(env)

      expect(request.parsed_form_data).to eq({ 'first' => '1', 'second' => '2' })
    end
  end

  describe '#options' do
    it 'returns true for an OPTIONS request' do
      env = { 'REQUEST_METHOD' => 'OPTIONS' }

      request = described_class.new(env)

      expect(request).to be_options
    end

    it 'returns false for non-OPTIONS requests' do
      env = { 'REQUEST_METHOD' => 'POST' }

      request = described_class.new(env)

      expect(request).not_to be_options
    end
  end
end
