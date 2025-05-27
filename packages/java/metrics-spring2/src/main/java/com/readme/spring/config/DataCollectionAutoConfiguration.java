package com.readme.spring.config;

import com.readme.core.config.CoreConfig;

import com.readme.core.dataextraction.LogOptions;
import com.readme.core.dataextraction.payload.requestresponse.RequestDataCollector;
import com.readme.core.dataextraction.payload.user.UserDataCollector;
import com.readme.core.datatransfer.DataSender;
import com.readme.core.datatransfer.HttpDataSender;
import com.readme.core.datatransfer.OutgoingLogBodyConstructor;
import com.readme.core.datatransfer.PayloadDataDispatcher;
import com.readme.spring.datacollection.DataCollectionFilter;
import com.readme.spring.datacollection.ServletDataPayloadAdapter;
import com.readme.spring.datacollection.userinfo.ServletUserDataCollector;
import com.readme.spring.datacollection.userinfo.UserDataExtractor;
import javax.annotation.PostConstruct;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import okhttp3.OkHttpClient;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.boot.logging.LogLevel;
import org.springframework.boot.logging.LoggingSystem;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.Ordered;
import org.springframework.core.env.Environment;

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
@ComponentScan(basePackages = {"com.readme.spring"})
@AllArgsConstructor
@Slf4j
public class DataCollectionAutoConfiguration {

    private ReadmeConfigurationProperties readmeProperties;

    private final LoggingSystem loggingSystem;

    private final Environment environment;

    /**
     * Configures logging level for ReadMe SDK based on application properties.
     */
    @PostConstruct
    public void configureLogging() {
        String logLevel = environment.getProperty("com.readme.logging.level", "OFF");
        loggingSystem.setLogLevel("com.readme", LogLevel.valueOf(logLevel));
    }

    /**
     * Registers the {@link DataCollectionFilter} as a servlet filter to intercept HTTP requests.
     *
     * @return a configured {@link FilterRegistrationBean} for data collection.
     */
    @Bean
    public FilterRegistrationBean<DataCollectionFilter> metricsFilter(
            RequestDataCollector<ServletDataPayloadAdapter> requestDataCollector,
            UserDataCollector<ServletDataPayloadAdapter> userDataCollector,
            PayloadDataDispatcher payloadDataDispatcher,
            LogOptions logOptions) {
        FilterRegistrationBean<DataCollectionFilter> registrationBean = new FilterRegistrationBean<>();
        registrationBean.setFilter(new DataCollectionFilter(userDataCollector, requestDataCollector, payloadDataDispatcher, logOptions));
        registrationBean.setOrder(Ordered.HIGHEST_PRECEDENCE);
        registrationBean.addUrlPatterns("/*");
        return registrationBean;
    }

    /**
     * Provides a default implementation of {@link UserDataCollector} if none is defined in the context.
     *
     * @return an instance of {@link ServletUserDataCollector}.
     */
    @Bean
    @ConditionalOnMissingBean(UserDataCollector.class)
    public UserDataCollector<ServletDataPayloadAdapter> userDataCollector(UserDataProperties userDataProperties,
                                                                          UserDataExtractor<ServletDataPayloadAdapter> extractionService) {
        log.info("readme-metrics: Creating of default user data collector");
        return new ServletUserDataCollector(userDataProperties, extractionService);
    }

    /**
     * Creates and configures the component responsible for sending log data to ReadMe API.
     *
     * @return an instance of {@link DataSender}.
     */
    @Bean
    public DataSender dataSender() {
        String readmeApiKey = readmeProperties.getReadmeApiKey();
        CoreConfig coreConfig = CoreConfig.builder()
                .readmeAPIKey(readmeApiKey)
                .build();
        OkHttpClient okHttpClient = new OkHttpClient();

        return new HttpDataSender(okHttpClient, coreConfig);
    }

    /**
     * Provides the component that transforms request/response/user data into HAR format.
     *
     * @return an instance of {@link OutgoingLogBodyConstructor}.
     */
    @Bean
    public OutgoingLogBodyConstructor outgoingPayloadConstructor() {
        return new OutgoingLogBodyConstructor();
    }

    /**
     * Instantiates the dispatcher responsible for buffering and sending payloads.
     *
     * @return a configured {@link PayloadDataDispatcher}.
     */
    @Bean
    public PayloadDataDispatcher payloadDataDispatcher(DataSender dataSender,
                                                       OutgoingLogBodyConstructor outgoingLogConstructor) {
        return new PayloadDataDispatcher(dataSender, outgoingLogConstructor);
    }

    /**
     * Provides default logging configuration options if none is defined.
     *
     * @return an instance of {@link LogOptions}.
     */
    @Bean
    @ConditionalOnMissingBean(LogOptions.class)
    public LogOptions logOptions() {
        return LogOptions.builder().build();
    }
}
