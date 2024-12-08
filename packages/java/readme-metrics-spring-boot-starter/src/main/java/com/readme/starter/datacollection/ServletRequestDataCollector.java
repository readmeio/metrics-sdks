package com.readme.starter.datacollection;

import com.readme.config.CoreConfig;
import com.readme.dataextraction.RequestDataCollector;
import com.readme.domain.UserData;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@AllArgsConstructor
public class ServletRequestDataCollector implements RequestDataCollector<HttpServletDataPayload> {

    private CoreConfig coreConfig;

    @Override
    public void collect(HttpServletDataPayload dataPayload, UserData userData) {
        String readmeAPIKey = coreConfig.getReadmeAPIKey();

        log.info(">>>>>>>> Sending data to the server....");
    }
}
