module Readme
  class Payload
    def initialize(har)
      @har = har
    end

    def to_json
      [
        {
          group: {id: "abc123", email: "user@example.com", label: "Joel"},
          clientIPAddress: "1.1.1.1",
          development: true,
          request: JSON.parse(@har.to_json)
        }
      ].to_json
    end
  end
end
