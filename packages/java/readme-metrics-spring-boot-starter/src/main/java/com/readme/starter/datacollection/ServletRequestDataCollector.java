package com.readme.starter.datacollection;

import com.readme.dataextraction.RequestDataCollector;
import com.readme.domain.UserData;
import com.readme.starter.config.ReadmeConfigurationProperties;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Slf4j
@AllArgsConstructor
@Component
public class ServletRequestDataCollector implements RequestDataCollector<ServletDataPayloadAdapter> {

    private ReadmeConfigurationProperties readmeProperties;

    @Override
    public void collect(ServletDataPayloadAdapter dataPayload, UserData userData) {
        String readmeAPIKey = readmeProperties.getReadmeApiKey();

        log.info(">>>>>>>> Sending data to the server with key {}", readmeAPIKey);
        log.info(">>>>>>>> and user data data: {}", userData);
    }
}
