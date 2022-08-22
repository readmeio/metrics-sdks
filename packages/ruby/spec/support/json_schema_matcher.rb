require 'json-schema'

RSpec::Matchers.define :match_json_schema do |schema|
  match do |json_body|
    validate_json(schema, json_body)
  end
end

def validate_json(schema, json_body)
  schema_directory = "#{Dir.pwd}/spec/schema"
  schema_path = "#{schema_directory}/#{schema}.json"
  JSON::Validator.validate!(schema_path, json_body)
end
