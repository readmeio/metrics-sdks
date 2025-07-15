package com.owl.example;

import com.readme.core.dataextraction.LogOptions;
import com.readme.core.dataextraction.payload.user.UserData;
import com.readme.core.dataextraction.payload.user.UserDataCollector;
import com.readme.spring.datacollection.ServletDataPayloadAdapter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

/**
 * Configuration class for customizing the strategy to collect user data.
 *
 * <p>This configuration provides a custom implementation of {@link UserDataCollector},
 * which overrides the default behavior provided by the SDK. It allows developers
 * to specify their own logic for extracting user-specific information, such as API keys,
 * email addresses, or labels, from the incoming HTTP requests.</p>
 *
 * <p>In this example, the API key is extracted from the HTTP headers using the header
 * "X-User-Name", while the email and label fields are hardcoded with custom values.
 * Developers can modify this logic to suit their application's requirements.</p>
 *
 * <p>By defining this bean, Spring Boot's auto-configuration will automatically use
 * this custom implementation instead of the default {@link UserDataCollector}.</p>
 */
@Configuration
public class CustomUserDataCollectorConfig {

    @Bean
    public UserDataCollector<ServletDataPayloadAdapter> customUserDataCollector() {
        return payloadAdapter -> {
            String apiKey = payloadAdapter.getRequestHeaders().get("x-user-name");
            return UserData.builder()
                    .apiKey(apiKey)
                    .email("owl@owlfactory.abc")
                    .label("owl-label")
                    .build();
        };
    }

    @Bean
    public LogOptions logOptions() {
        return LogOptions.builder()
                .baseLogUrl("http://base.log.url")
                .bufferLength(1)
                .denylist(List.of("denied-param"))
                .build();
    }
}
