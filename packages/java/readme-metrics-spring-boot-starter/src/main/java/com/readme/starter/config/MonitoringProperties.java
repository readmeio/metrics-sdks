package com.readme.starter.config;

import com.readme.config.FieldMapping;
import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

/**
 * Configuration properties for monitoring library.
 * <p>
 * This class allows users to configure sources and field names for extracting
 * user-related information (e.g., username, email, and label) from HTTP requests.
 * Each field (username, email, label) can be configured with a specific source
 * (e.g., header, jwtClaim, or jsonBody) and its corresponding value.
 * </p>
 */
@Configuration
@ConfigurationProperties(prefix = "readme.userdata")
@Data
public class MonitoringProperties {

    private String readmeApiKey;
    private FieldMapping apiKey;
    private FieldMapping email;
    private FieldMapping label;

}

