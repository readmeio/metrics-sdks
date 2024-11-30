package com.readme.starter.config;

import com.readme.config.CoreConfig;
import com.readme.config.UserDataConfig;
import com.readme.dataextraction.RequestDataCollector;
import com.readme.dataextraction.UserDataCollector;
import com.readme.dataextraction.UserDataExtractor;
import com.readme.dataextraction.servlets.jakarta.JakartaDataCollectionFilter;
import com.readme.dataextraction.servlets.jakarta.JakartaHttpServletDataPayload;
import com.readme.dataextraction.servlets.jakarta.JakartaServletRequestDataCollector;
import com.readme.dataextraction.servlets.jakarta.userinfo.JakartaServletUserDataExtractor;
import com.readme.dataextraction.servlets.jakarta.userinfo.JakartaUserDataCollector;
import jakarta.servlet.Filter;
import org.springframework.boot.autoconfigure.condition.ConditionalOnClass;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Configuration class for registering and initializing the JakartaDataCollectionFilter
 * along with its dependencies in a Spring Boot application.
 * <p>
 * This configuration provides the following:
 * <ul>
 *     <li>Instantiates the {@link JakartaDataCollectionFilter} with required collectors.</li>
 *     <li>Registers the filter using {@link FilterRegistrationBean} for servlet-based applications.</li>
 *     <li>Sets up default implementations for collecting request and user data.</li>
 * </ul>
 */
@Configuration
@ConditionalOnClass(name = "jakarta.servlet.http.HttpServletRequest")
public class JakartaDataCollectionConfig {

    private MonitoringProperties monitoringProperties;

    @Bean
    public UserDataCollector<JakartaHttpServletDataPayload>
    userDataCollector(UserDataExtractor<JakartaHttpServletDataPayload> userDataExtractor) {
        UserDataConfig userDataConfig = UserDataConfig.builder()
                .apiKey(monitoringProperties.getApiKey())
                .email(monitoringProperties.getEmail())
                .label(monitoringProperties.getLabel())
                .build();

        return new JakartaUserDataCollector(userDataConfig, userDataExtractor);
    }

    @Bean
    public UserDataExtractor<JakartaHttpServletDataPayload> userDataExtractor() {
        return new JakartaServletUserDataExtractor();
    }



    @Bean
    public JakartaDataCollectionFilter jakartaDataCollectionFilter
            (UserDataCollector<JakartaHttpServletDataPayload> userDataCollector,
             RequestDataCollector<JakartaHttpServletDataPayload> requestDataCollector) {
        return new JakartaDataCollectionFilter(requestDataCollector, userDataCollector);
    }

    @Bean
    public RequestDataCollector<JakartaHttpServletDataPayload> requestDataCollector() {
        String readmeApiKey = monitoringProperties.getReadmeApiKey();

        CoreConfig coreConfig = CoreConfig.builder()
                .readmeAPIKey(readmeApiKey)
                .build();

        return new JakartaServletRequestDataCollector(coreConfig);
    }

}
