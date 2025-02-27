package com.readme.spring.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Data
@Component
@ConfigurationProperties(prefix = "readme")
public class ReadmeConfigurationProperties {

    private String readmeApiKey;

}
