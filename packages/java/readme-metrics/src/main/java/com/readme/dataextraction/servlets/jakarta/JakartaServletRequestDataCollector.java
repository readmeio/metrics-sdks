package com.readme.dataextraction.servlets.jakarta;

import com.readme.config.CoreConfig;
import com.readme.dataextraction.RequestDataCollector;
import com.readme.domain.UserData;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@AllArgsConstructor
public class JakartaServletRequestDataCollector implements RequestDataCollector<JakartaHttpServletDataPayload> {

    private CoreConfig coreConfig;

    //TODO do we really need UserData here as a parameter?
    @Override
    public void collect(JakartaHttpServletDataPayload dataPayload, UserData userData) {
        String readmeAPIKey = coreConfig.getReadmeAPIKey();

        log.info(">>>>>>>> Sending data to the server....");
    }
}
