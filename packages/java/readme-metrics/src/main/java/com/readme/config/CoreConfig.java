package com.readme.config;

import lombok.Builder;
import lombok.Value;

@Builder
@Value
public class CoreConfig {

    String readmeAPIKey;

    public CoreConfig(String readmeAPIKey) {
        this.readmeAPIKey = readmeAPIKey;
    }

}