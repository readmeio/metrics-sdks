require 'digest'

module Readme
  class Mask
    def self.mask(data)
      digest = Digest::SHA2.new(512).base64digest(data)
      opts = data.length >= 4 ? data[-4, 4] : data
      "sha512-#{digest}?#{opts}"
    end
  end
end
