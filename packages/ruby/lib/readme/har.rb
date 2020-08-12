module Readme
  class Har
    def initialize(env)
      @env = env
    end

    def to_json
      File.read(File.expand_path("../../har.json", __FILE__))
    end
  end
end
