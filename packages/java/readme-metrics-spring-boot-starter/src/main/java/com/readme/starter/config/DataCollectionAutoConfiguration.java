package com.readme.starter.config;

import com.readme.dataextraction.RequestDataCollector;
import com.readme.dataextraction.UserDataCollector;
import com.readme.starter.datacollection.DataCollectionFilter;
import com.readme.starter.datacollection.ServletDataPayloadAdapter;
import lombok.AllArgsConstructor;
import org.springframework.boot.autoconfigure.condition.ConditionalOnClass;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.Ordered;

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
@ConditionalOnClass({UserDataProperties.class})
@ComponentScan(basePackages = {"com.readme.starter"})
@AllArgsConstructor
public class DataCollectionAutoConfiguration {

    @Bean
    public FilterRegistrationBean<DataCollectionFilter> metricsFilter(
            RequestDataCollector<ServletDataPayloadAdapter> requestDataCollector,
            UserDataCollector<ServletDataPayloadAdapter> userDataCollector) {
        FilterRegistrationBean<DataCollectionFilter> registrationBean = new FilterRegistrationBean<>();
        registrationBean.setFilter(new DataCollectionFilter(requestDataCollector, userDataCollector));
        registrationBean.setOrder(Ordered.HIGHEST_PRECEDENCE);
        registrationBean.addUrlPatterns("/*");
        return registrationBean;
    }

}
