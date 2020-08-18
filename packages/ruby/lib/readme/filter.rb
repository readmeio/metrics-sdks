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

  class AllowOnly
    def initialize(filter_values)
      @filter_values = filter_values
    end

    def filter(hash)
      hash.select { |key, _value| @filter_values.include?(key) }
    end
  end

  class RejectParams
    def initialize(filter_values)
      @filter_values = filter_values
    end

    def filter(hash)
      hash.reject { |key, _value| @filter_values.include?(key) }
    end
  end

  class None
    def filter(hash)
      hash
    end
  end

  class FilterArgsError < StandardError
    def initialize
      msg = "Can only supply either reject_params or allow_only, not both."
      super(msg)
    end
  end
end
