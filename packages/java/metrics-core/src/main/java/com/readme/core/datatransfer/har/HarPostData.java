package com.readme.core.datatransfer.har;

import com.fasterxml.jackson.annotation.JsonAnyGetter;
import com.fasterxml.jackson.annotation.JsonAnySetter;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Data;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static com.readme.core.datatransfer.har.MemoryOptimisationConstants.DEFAULT_MAP_INIT_CAPACITY;

@JsonInclude(JsonInclude.Include.NON_NULL)
@JsonIgnoreProperties(ignoreUnknown = true)
@Builder
@Data
public class HarPostData {

    private String mimeType;
    @Builder.Default
    private List<HarPostDataParam> params = new ArrayList<>(4);
    private String text;
    private String comment;
    private Map<String, Object> additional;

    @JsonAnyGetter
    public Map<String, Object> getAdditional() {
        return additional;
    }

    @JsonAnySetter
    public void setAdditionalField(String key, Object value) {
        if (additional == null) {
            additional = new HashMap<>(DEFAULT_MAP_INIT_CAPACITY);
        }
        this.additional.put(key, value);
    }

}
