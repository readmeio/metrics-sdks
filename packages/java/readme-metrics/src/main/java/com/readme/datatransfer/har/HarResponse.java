package com.readme.datatransfer.har;

import com.fasterxml.jackson.annotation.JsonAnyGetter;
import com.fasterxml.jackson.annotation.JsonAnySetter;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Data;

import java.util.HashMap;
import java.util.List;
import java.util.Map;


@JsonInclude(JsonInclude.Include.NON_NULL)
@JsonIgnoreProperties(ignoreUnknown = true)
@Data
@Builder
public class HarResponse {

    protected static final long DEFAULT_SIZE = -1L;

    private int status;
    private String statusText;
    private String httpVersion;
    private List<HarCookie> cookies;
    private List<HarHeader> headers;
    private HarContent content;
    private String redirectURL;
    @Builder.Default
    private long headersSize = DEFAULT_SIZE;
    @Builder.Default
    private long bodySize = DEFAULT_SIZE;
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

}
