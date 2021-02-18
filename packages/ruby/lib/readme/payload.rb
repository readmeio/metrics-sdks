module Readme
  class Payload
    def initialize(har, user_info, development:)
      @har = har
      # swap api_key for id
      user_info[:id] = user_info.delete :api_key unless user_info[:api_key].nil?
      @user_info = user_info
      @development = development
    end

    def to_json
      {
        group: @user_info,
        clientIPAddress: "1.1.1.1",
        development: @development,
        request: JSON.parse(@har.to_json)
      }.to_json
    end
  end
end
