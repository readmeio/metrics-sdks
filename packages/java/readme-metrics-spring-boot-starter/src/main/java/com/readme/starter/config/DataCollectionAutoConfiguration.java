package com.readme.starter.config;

import com.readme.config.CoreConfig;

import com.readme.dataextraction.payload.requestresponse.RequestDataCollector;
import com.readme.dataextraction.payload.user.UserDataCollector;
import com.readme.datatransfer.DataSender;
import com.readme.datatransfer.HttpDataSender;
import com.readme.datatransfer.OutgoingLogBodyConstructor;
import com.readme.datatransfer.PayloadDataDispatcher;
import com.readme.starter.datacollection.DataCollectionFilter;
import com.readme.starter.datacollection.ServletDataPayloadAdapter;
import com.readme.starter.datacollection.userinfo.ServletUserDataCollector;
import com.readme.starter.datacollection.userinfo.UserDataExtractor;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import okhttp3.OkHttpClient;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
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
@ComponentScan(basePackages = {"com.readme.starter"})
@AllArgsConstructor
@Slf4j
public class DataCollectionAutoConfiguration {

    private ReadmeConfigurationProperties readmeProperties;

    @Bean
    public FilterRegistrationBean<DataCollectionFilter> metricsFilter(
            RequestDataCollector<ServletDataPayloadAdapter> requestDataCollector,
            UserDataCollector<ServletDataPayloadAdapter> userDataCollector,
            PayloadDataDispatcher payloadDataDispatcher) {
        FilterRegistrationBean<DataCollectionFilter> registrationBean = new FilterRegistrationBean<>();
        registrationBean.setFilter(new DataCollectionFilter(userDataCollector, requestDataCollector, payloadDataDispatcher));
        registrationBean.setOrder(Ordered.HIGHEST_PRECEDENCE);
        registrationBean.addUrlPatterns("/*");
        return registrationBean;
    }

    @Bean
    @ConditionalOnMissingBean(UserDataCollector.class)
    public UserDataCollector<ServletDataPayloadAdapter> userDataCollector(UserDataProperties userDataProperties,
                                                                          UserDataExtractor<ServletDataPayloadAdapter> extractionService) {
        log.info("readme-metrics: Creating of default user data collector");
        return new ServletUserDataCollector(userDataProperties, extractionService);
    }

    @Bean
    public DataSender dataSender() {
        String readmeApiKey = readmeProperties.getReadmeApiKey();
        CoreConfig coreConfig = CoreConfig.builder()
                .readmeAPIKey(readmeApiKey)
                .build();
        OkHttpClient okHttpClient = new OkHttpClient();

        return new HttpDataSender(okHttpClient, coreConfig);
    }

    @Bean
    public OutgoingLogBodyConstructor outgoingPayloadConstructor() {
        return new OutgoingLogBodyConstructor();
    }

    @Bean
    public PayloadDataDispatcher payloadDataDispatcher(DataSender dataSender,
                                                       OutgoingLogBodyConstructor outgoingLogConstructor) {
        return new PayloadDataDispatcher(dataSender, outgoingLogConstructor);
    }
}
