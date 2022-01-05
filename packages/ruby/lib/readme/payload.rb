require "uuid"

module Readme
  class Payload
    attr_reader :ignore

    def initialize(har, info, development:)
      @har = har
      # swap api_key for id
      info[:id] = info.delete :api_key unless info[:api_key].nil?
      # pull log_id and ignore fields out of info to construct a user_info hash that can be assigned to the group key
      @log_id = info[:log_id]
      @ignore = info[:ignore]
      info.delete :log_id
      info.delete :ignore
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
