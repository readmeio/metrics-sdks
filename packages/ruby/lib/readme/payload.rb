require "uuid"

module Readme
  class Payload
    attr_reader :ignore

    def initialize(har, info, development:)
      @har = har
      @user_info = info.slice(:id, :label, :email)
      @user_info[:id] = info[:api_key] unless info[:api_key].nil? # swap api_key for id if api_key is present
      @log_id = info[:log_id]
      @ignore = info[:ignore]
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
