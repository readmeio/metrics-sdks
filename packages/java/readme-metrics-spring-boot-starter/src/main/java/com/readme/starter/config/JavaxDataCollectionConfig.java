package com.readme.starter.config;


import com.readme.config.CoreConfig;
import com.readme.config.UserDataConfig;
import com.readme.dataextraction.RequestDataCollector;
import com.readme.dataextraction.UserDataCollector;
import com.readme.dataextraction.UserDataExtractor;
import com.readme.dataextraction.servlets.javax.JavaxDataCollectionFilter;
import com.readme.dataextraction.servlets.javax.JavaxHttpServletDataPayload;
import com.readme.dataextraction.servlets.javax.JavaxServletRequestDataCollector;
import com.readme.dataextraction.servlets.javax.userinfo.JavaxServletUserDataExtractor;
import com.readme.dataextraction.servlets.javax.userinfo.JavaxUserDataCollector;
import org.springframework.boot.autoconfigure.condition.ConditionalOnClass;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Configuration class for registering and initializing the javaxDataCollectionFilter
 * along with its dependencies in a Spring Boot application.
 * <p>
 * This configuration provides the following:
 * <ul>
 *     <li>Instantiates the {@link javaxDataCollectionFilter} with required collectors.</li>
 *     <li>Registers the filter using {@link FilterRegistrationBean} for servlet-based applications.</li>
 *     <li>Sets up default implementations for collecting request and user data.</li>
 * </ul>
 */
@Configuration
@ConditionalOnClass(name = "javax.servlet.http.HttpServletRequest")
public class JavaxDataCollectionConfig {

    private MonitoringProperties monitoringProperties;

    @Bean
    public UserDataCollector<JavaxHttpServletDataPayload>
    userDataCollector(UserDataExtractor<JavaxHttpServletDataPayload> userDataExtractor) {
        UserDataConfig userDataConfig = UserDataConfig.builder()
                .apiKey(monitoringProperties.getApiKey())
                .email(monitoringProperties.getEmail())
                .label(monitoringProperties.getLabel())
                .build();

        return new JavaxUserDataCollector(userDataConfig, userDataExtractor);
    }

    @Bean
    public UserDataExtractor<JavaxHttpServletDataPayload> userDataExtractor() {
        return new JavaxServletUserDataExtractor();
    }



    @Bean
    public JavaxDataCollectionFilter javaxDataCollectionFilter
            (UserDataCollector<JavaxHttpServletDataPayload> userDataCollector,
             RequestDataCollector<JavaxHttpServletDataPayload> requestDataCollector) {
        return new JavaxDataCollectionFilter(requestDataCollector, userDataCollector);
    }

    @Bean
    public RequestDataCollector<JavaxHttpServletDataPayload> requestDataCollector() {
        String readmeApiKey = monitoringProperties.getReadmeApiKey();

        CoreConfig coreConfig = CoreConfig.builder()
                .readmeAPIKey(readmeApiKey)
                .build();

        return new JavaxServletRequestDataCollector(coreConfig);
    }

    @Bean
    public FilterRegistrationBean<JavaxDataCollectionFilter> JavaxDataCollectionFilterRegistration(
            JavaxDataCollectionFilter javaxDataCollectionFilter) {

        FilterRegistrationBean<Filter> registrationBean = new FilterRegistrationBean<>();
        registrationBean.setFilter(javaxDataCollectionFilter);
        registrationBean.addUrlPatterns("/*");
        registrationBean.setName("JavaxDataCollectionFilter");
        registrationBean.setOrder(1);

        return registrationBean;
    }
}
