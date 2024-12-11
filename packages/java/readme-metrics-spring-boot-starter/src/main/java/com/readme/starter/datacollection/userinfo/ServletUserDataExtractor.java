package com.readme.starter.datacollection.userinfo;

import com.readme.dataextraction.UserDataExtractor;
import com.readme.starter.datacollection.ServletDataPayloadAdapter;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.Map;

@AllArgsConstructor
@Component
@Slf4j
public class ServletUserDataExtractor implements UserDataExtractor<ServletDataPayloadAdapter> {

    //TODO: Consider possibility to extract the data from the header multiple value
    @Override
    public String extractFromHeader(ServletDataPayloadAdapter payload, String fieldName) {
        Map<String, String> requestHeaders = payload.getRequestHeaders();
        if (requestHeaders.containsKey(fieldName)) {
            return requestHeaders.get(fieldName);
        }
        log.error("The provided header name {} does not exist.", fieldName);
        return "";
    }

    @Override
    public String extractFromBody(ServletDataPayloadAdapter payload, String fieldName) {
        return "Field value from body";
    }

    @Override
    public String extractFromJwt(ServletDataPayloadAdapter payload, String fieldName) {
        return "Field value from jwt";
    }

}
