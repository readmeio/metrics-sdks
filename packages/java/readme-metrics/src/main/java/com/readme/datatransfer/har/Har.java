package com.readme.datatransfer.har;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Data;


/**
 * This class represents a HAR (HTTP Archive) request structure.
 *
 * The HAR model used here, along with all related fields and classes in its hierarchy,
 * has been custom-implemented. The decision to use custom models instead of relying
 * on third-party libraries was made due to the following reasons:
 *
 * 1. Some existing HAR libraries either do not support quite modern Java versions (e.g., Java 17-)
 *    or lack active maintenance, which introduces compatibility challenges.
 *
 * 2. The older versions of those libraries contain security vulnerabilities in their transitive
 *    dependencies, which could pose risks if included in the project.
 *
 * 3. Third-party HAR libraries often bring in unnecessary dependencies, increasing the
 *    overall size and complexity of the project and introducing undesired external ties.
 *    However, all we need is to have only models (POJO) classes
 *
 * By using custom implementations, this project ensures compatibility, security, and
 * minimal dependencies while adhering to the HAR specification.
 */
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
