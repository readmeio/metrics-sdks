module Readme
  module ContentTypeHelper
    # Assumes the includer has a `content_type` method defined.

    JSON_MIME_TYPES = [
      'application/json',
      'application/x-json',
      'text/json',
      'text/x-json',
      '+json'
    ].freeze

    def json?
      JSON_MIME_TYPES.any? { |mime_type| content_type.include?(mime_type) }
    end
  end
end
