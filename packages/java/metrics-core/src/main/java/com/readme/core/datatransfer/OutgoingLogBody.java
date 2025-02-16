package com.readme.core.datatransfer;

import com.readme.core.datatransfer.har.Group;
import com.readme.core.datatransfer.har.Har;
import lombok.Builder;
import lombok.Value;

import java.util.UUID;

@Value
@Builder
public class OutgoingLogBody {

    UUID id;
    int version;
    String clientIPAddress;
    boolean development;
    Group group;

    /**
     * This field represents a HAR (HTTP Archive) request structure.
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
    Har request;

}