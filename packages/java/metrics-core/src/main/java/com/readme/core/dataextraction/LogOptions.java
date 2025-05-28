package com.readme.core.dataextraction;


import lombok.Builder;
import lombok.Value;

import java.util.List;

@Value
@Builder
public class LogOptions {

    /**
     * An array of values to include in the incoming and outgoing headers, parameters and body;
     * everything else will be redacted.
     *
     * If set, the denylist will be ignored.
     */

    List<String> allowlist;

    /**
     * An array of values to redact from the incoming and outgoing headers, parameters and body.
     */
    List<String> denylist;

    /**
     * If true, the logs will be marked as development logs.
     */
    boolean development;

    /**
     * If true, this will return the log details without waiting for a response from the Metrics
     * servers.
     */
    boolean fireAndForget;

    /**
     * URL for your documentation site
     */
    String baseLogUrl;

    /**
     * Buffer size
     */
    @Builder.Default
    int bufferLength = 1;

}