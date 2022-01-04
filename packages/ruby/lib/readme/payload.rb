require "uuid"

module Readme
  class Payload
    def initialize(har, info, development:)
      @har = har
      # swap api_key for id
      info[:id] = info.delete :api_key unless info[:api_key].nil?
      @log_id = info[:log_id]
      info.delete :log_id
      @user_info = info
      @development = development
      @uuid = UUID.new
    end

    def to_json
      {
        logId: UUID.validate(@log_id) ? @log_id : @uuid.generate,
        group: @user_info,
        clientIPAddress: "1.1.1.1",
        development: @development,
        request: JSON.parse(@har.to_json)
      }.to_json
    end
  end
end
