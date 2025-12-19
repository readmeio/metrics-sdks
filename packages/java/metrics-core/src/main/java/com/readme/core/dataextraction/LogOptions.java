package com.readme.core.dataextraction;

import lombok.Getter;
import lombok.ToString;
import org.jetbrains.annotations.NotNull;

import java.util.List;
import java.util.Locale;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

@Getter
@ToString
public class LogOptions {

    /**
     * An array of values to include in the incoming and outgoing headers, parameters and body;
     * everything else will be redacted.
     *
     * If set, the denylist will be ignored.
     */

    private Set<String> allowlist;

    /**
     * An array of values to redact from the incoming and outgoing headers, parameters and body.
     */
    private Set<String> denylist;

    /**
     * If true, the logs will be marked as development logs.
     */
    private boolean development;

    /**
     * If true, this will return the log details without waiting for a response from the Metrics
     * servers.
     */
    private boolean fireAndForget;

    /**
     * URL for your documentation site
     */
    private String baseLogUrl;

    /**
     * Buffer size
     */
    int bufferLength;

    private LogOptions(Builder builder) {
        this.allowlist = builder.allowlist;
        this.denylist = builder.denylist;
        this.development = builder.development;
        this.fireAndForget = builder.fireAndForget;
        this.baseLogUrl = builder.baseLogUrl;
        this.bufferLength = builder.bufferLength;
    }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private Set<String> allowlist;
        private Set<String> denylist;
        private boolean development;
        private boolean fireAndForget;
        private String baseLogUrl;
        private int bufferLength = 1; // default

        @NotNull
        private static Set<String> castToSetWithLowercase(List<String> allowlist) {
            return allowlist.stream()
                    .filter(Objects::nonNull)
                    .map(a -> a.toLowerCase(Locale.ROOT))
                    .collect(Collectors.toSet());
        }

        public Builder allowlist(List<String> allowlist) {
            this.allowlist = castToSetWithLowercase(allowlist);
            return this;
        }

        public Builder denylist(List<String> denylist) {
            this.denylist = castToSetWithLowercase(denylist);;
            return this;
        }

        public Builder development(boolean development) {
            this.development = development;
            return this;
        }

        public Builder fireAndForget(boolean fireAndForget) {
            this.fireAndForget = fireAndForget;
            return this;
        }

        public Builder baseLogUrl(String baseLogUrl) {
            this.baseLogUrl = baseLogUrl;
            return this;
        }

        public Builder bufferLength(int bufferLength) {
            this.bufferLength = bufferLength;
            return this;
        }

        public LogOptions build() {
            return new LogOptions(this);
        }
    }
}