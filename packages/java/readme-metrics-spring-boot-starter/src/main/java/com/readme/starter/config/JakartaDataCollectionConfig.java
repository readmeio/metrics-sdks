package com.readme.starter.config;

import com.readme.config.CoreConfig;
import com.readme.config.UserDataConfig;
import com.readme.dataextraction.RequestDataCollector;
import com.readme.dataextraction.UserDataExtractor;
import com.readme.starter.datacollection.DataCollectionFilter;
import com.readme.starter.datacollection.HttpServletDataPayload;
import com.readme.starter.datacollection.ServletRequestDataCollector;
import com.readme.starter.datacollection.userinfo.ServletUserDataExtractor;
import com.readme.starter.datacollection.userinfo.ServletUserDataCollector;
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
 *     <li>Instantiates the {@link DataCollectionFilter} with required collectors.</li>
 *     <li>Registers the filter using {@link FilterRegistrationBean} for servlet-based applications.</li>
 *     <li>Sets up default implementations for collecting request and user data.</li>
 * </ul>
 */
@Configuration
public class JakartaDataCollectionConfig {

    private MonitoringProperties monitoringProperties;

    @Bean
    public com.readme.dataextraction.UserDataCollector<HttpServletDataPayload>
    userDataCollector(UserDataExtractor<HttpServletDataPayload> userDataExtractor) {
        UserDataConfig userDataConfig = UserDataConfig.builder()
                .apiKey(monitoringProperties.getApiKey())
                .email(monitoringProperties.getEmail())
                .label(monitoringProperties.getLabel())
                .build();

        return new ServletUserDataCollector(userDataConfig, userDataExtractor);
    }

    @Bean
    public UserDataExtractor<HttpServletDataPayload> userDataExtractor() {
        return new ServletUserDataExtractor();
    }



    @Bean
    public DataCollectionFilter dataCollectionFilter
            (com.readme.dataextraction.UserDataCollector<HttpServletDataPayload> userDataCollector,
             RequestDataCollector<HttpServletDataPayload> requestDataCollector) {
        return new DataCollectionFilter(requestDataCollector, userDataCollector);
    }

    @Bean
    public RequestDataCollector<HttpServletDataPayload> requestDataCollector() {
        String readmeApiKey = monitoringProperties.getReadmeApiKey();

        CoreConfig coreConfig = CoreConfig.builder()
                .readmeAPIKey(readmeApiKey)
                .build();

        return new ServletRequestDataCollector(coreConfig);
    }

}
