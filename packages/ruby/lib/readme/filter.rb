# frozen_string_literal: true

module Readme
  class Filter
    def self.for(reject: nil, allow_only: nil)
      raise FilterArgsError if reject && allow_only
      return RejectParams.new(reject) if reject
      return AllowOnly.new(allow_only) if allow_only

      None.new
    end

    def self.redact(value)
      value.is_a?(String) ? "[REDACTED #{value.length}]" : '[REDACTED]'
    end

    def self.redact_json(json_str)
      return json_str unless json_str.is_a?(String)

      begin
        data = JSON.parse(json_str)
        JSON.generate(process_value(data))
      rescue JSON::ParserError
        json_str
      end
    end

    def self.process_value(value)
      case value
      when Hash
        value.transform_values { |v| process_value(v) }
      when Array
        value.map { |item| process_value(item) }
      when String
        "[REDACTED #{value.length}]"
      else
        '[REDACTED]'
      end
    end

    module PathProcessor
      def parse_path(path)
        case path
        when String
          path.gsub('[]', '').downcase.split('.')
        else
          [path.to_s.downcase]
        end
      end

      def process_hash(hash, current_path = [])
        return hash unless hash.is_a?(Hash)

        hash.each_with_object({}) do |(key, value), result|
          path = current_path + [key.downcase]
          result[key] = process_value(value, path)
        end
      end

      def process_value(value, path)
        if should_process_deeper?(path)
          if value.is_a?(Hash)
            process_hash(value, path)
          elsif value.is_a?(Array)
            value.map { |item| item.is_a?(Hash) ? process_hash(item, path) : item }
          else
            value
          end
        else
          should_redact?(path) ? Filter.redact(value) : value
        end
      end

      def path_starts_with?(path_a, path_b)
        return false if path_a.length > path_b.length

        path_a.zip(path_b).all? { |a, b| a == b }
      end
    end

    class RejectParams
      include PathProcessor

      def initialize(filter_fields)
        @paths = filter_fields.map { |field| parse_path(field) }
      end

      def filter(hash)
        process_hash(hash)
      end

      def pass_through?
        false
      end

      private

      def should_process_deeper?(current_path)
        @paths.any? { |path| path.length > current_path.length && path_starts_with?(current_path, path) }
      end

      def should_redact?(current_path)
        @paths.any?(current_path)
      end
    end

    class AllowOnly
      include PathProcessor

      def initialize(filter_fields)
        @paths = filter_fields.map { |field| parse_path(field) }
      end

      def filter(hash)
        process_hash(hash)
      end

      def pass_through?
        false
      end

      private

      def should_process_deeper?(current_path)
        @paths.any? { |path| path_starts_with?(current_path, path) || path_starts_with?(path, current_path) }
      end

      def should_redact?(current_path)
        @paths.none?(current_path)
      end
    end

    class None
      def filter(hash)
        hash
      end

      def pass_through?
        true
      end
    end

    class FilterArgsError < StandardError
      def initialize
        super('Can only supply either reject_params or allow_only, not both.')
      end
    end
  end
end
