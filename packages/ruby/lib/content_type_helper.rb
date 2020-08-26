module ContentTypeHelper
  # Assumes the includer has a `content_type` method defined.

  JSON_MIME_TYPES = [
    "application/json",
    "application/x-json",
    "text/json",
    "text/x-json",
    "+json"
  ]

  def json?
    JSON_MIME_TYPES.include? content_type
  end
end
