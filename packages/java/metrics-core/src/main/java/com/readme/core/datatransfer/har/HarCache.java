package com.readme.core.datatransfer.har;

import com.fasterxml.jackson.annotation.JsonAnyGetter;
import com.fasterxml.jackson.annotation.JsonAnySetter;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Data;

import java.util.Date;
import java.util.HashMap;
import java.util.Map;


@JsonInclude(JsonInclude.Include.NON_NULL)
@JsonIgnoreProperties(ignoreUnknown = true)
@Data
@Builder
public class HarCache {

    private HarCacheInfo beforeRequest;
    private HarCacheInfo afterRequest;
    private String comment;
    private Map<String, Object> additional;

    @JsonAnyGetter
    public Map<String, Object> getAdditional() {
        return additional;
    }

    @JsonAnySetter
    public void setAdditionalField(String key, Object value) {
        if (additional == null) {
            additional = new HashMap<>(8);
        }
        this.additional.put(key, value);
    }

    @JsonInclude(JsonInclude.Include.NON_NULL)
    @JsonIgnoreProperties(ignoreUnknown = true)
    @Data
    @Builder
    public static final class HarCacheInfo {

        private Date expires;
        private Date lastAccess;
        private String eTag;
        private int hitCount;
        private String comment;
        private final Map<String, Object> additional = new HashMap<>();

        @JsonAnyGetter
        public Map<String, Object> getAdditional() {
            return additional;
        }

        @JsonAnySetter
        public void setAdditionalField(String key, Object value) {
            this.additional.put(key, value);
        }

    }
}
