module Readme
  class Payload
    def initialize(har, user_info)
      @har = har
      @user_info = user_info
    end

    def to_json
      [
        {
          group: @user_info,
          clientIPAddress: "1.1.1.1",
          development: true,
          request: JSON.parse(@har.to_json)
        }
      ].to_json
    end
  end
end
