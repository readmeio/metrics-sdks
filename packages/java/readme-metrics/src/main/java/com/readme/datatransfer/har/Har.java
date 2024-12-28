package com.readme.datatransfer.har;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Data;

@JsonInclude(JsonInclude.Include.NON_NULL)
@JsonIgnoreProperties(ignoreUnknown = true)
@Builder
@Data
public class Har {

    private HarLog log;

    public HarLog getLog() {
        if (log == null) {
            log = HarLog.builder().build();
        }
        return log;
    }

}
