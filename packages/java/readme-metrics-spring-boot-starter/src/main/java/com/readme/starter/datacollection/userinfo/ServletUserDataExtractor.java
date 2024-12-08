package com.readme.starter.datacollection.userinfo;

import com.readme.dataextraction.UserDataExtractor;
import com.readme.dataextraction.UserDataField;
import com.readme.starter.datacollection.HttpServletDataPayload;
import lombok.AllArgsConstructor;

@AllArgsConstructor
public class ServletUserDataExtractor implements UserDataExtractor<HttpServletDataPayload> {

    @Override
    public String extractFromHeader(HttpServletDataPayload payload, UserDataField fieldName) {
        return "Field value from header";
    }

    @Override
    public String extractFromBody(HttpServletDataPayload payload, UserDataField fieldName) {
        return "Field value from body";
    }

    @Override
    public String extractFromJwt(HttpServletDataPayload payload, UserDataField fieldName) {
        return "Field value from jwt";
    }

}
