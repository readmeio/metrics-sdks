package com.readme.spring.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * Configuration properties for the ReadMe Metrics SDK.
 * <p>
 * This class binds to properties defined with the prefix <code>readme</code>
 * in the application's <code>application.yaml</code> or <code>application.properties</code> file.
 * <p>
 * Example usage in <code>application.yaml</code>:
 * <pre>
 * readme:
 *   readmeApiKey: your-api-key-here
 * </pre>
 */
@Data
@Component
@ConfigurationProperties(prefix = "readme")
public class ReadmeConfigurationProperties {

    /**
     * The API key used to authenticate requests to the ReadMe platform.
     */
    private String readmeApiKey;

}
