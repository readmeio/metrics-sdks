class Filter
  def self.for(reject: nil, allow_only: nil)
    if !reject.nil? && !allow_only.nil?
      raise FilterArgsError
    elsif !reject.nil?
      RejectParams.new(reject)
    elsif !allow_only.nil?
      AllowOnly.new(allow_only)
    else
      None.new
    end
  end

  def self.redact(rejected_params)
    rejected_params.each_with_object({}) do |(k, v), hash|
      # If it's a string then return the length of the redacted field
      hash[k.to_str] = "[REDACTED#{v.instance_of?(String) ? " #{v.length}" : ""}]"
    end
  end

  class AllowOnly
    def initialize(filter_fields)
      @allowed_fields = filter_fields
    end

    def filter(hash)
      allowed_fields = @allowed_fields.map(&:downcase)
      # Select all fields that are allowed
      allowed_params = hash.select { |key, _value| allowed_fields.include?(key.downcase) }
      # If a field is not in the allowed fields reject it
      rejected_params = hash.reject { |key, _value| allowed_fields.include?(key.downcase) }
      # Merge the result together
      allowed_params.merge(Filter.redact(rejected_params))
    end

    def pass_through?
      false
    end
  end

  class RejectParams
    def initialize(filter_fields)
      @rejected_fields = filter_fields
    end

    def filter(hash)
      rejected_fields = @rejected_fields.map(&:downcase)
      # Reject all items in the rejected fields
      allowed_params = hash.reject { |key, _value| rejected_fields.include?(key.downcase) }
      # Get all the rejected fields
      rejected_params = hash.select { |key, _value| rejected_fields.include?(key.downcase) }

      allowed_params.merge(Filter.redact(rejected_params))
    end

    def pass_through?
      false
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
      msg = "Can only supply either reject_params or allow_only, not both."
      super(msg)
    end
  end
end
