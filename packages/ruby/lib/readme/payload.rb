require 'readme/mask'
require 'socket'
require 'securerandom'

def validate_uuid(uuid)
  return if uuid.nil?

  uuid.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i)
end

module Readme
  class Payload
    attr_reader :ignore

    def initialize(har, info, ip_address, development:)
      @har = har
      @user_info = info.slice(:id, :label, :email)
      @user_info[:id] = info[:api_key] unless info[:api_key].nil? # swap api_key for id if api_key is present
      @user_info[:id] = Readme::Mask.mask(@user_info[:id])
      @log_id = info[:log_id]
      @ignore = info[:ignore]
      @ip_address = ip_address
      @development = development
      @uuid = SecureRandom.uuid
    end

    def to_json(*_args)
      {
        _id: validate_uuid(@log_id) ? @log_id : @uuid,
        _version: 3,
        group: @user_info,
        clientIPAddress: @ip_address,
        development: @development,
        request: JSON.parse(@har.to_json)
      }.to_json
    end
  end
end
