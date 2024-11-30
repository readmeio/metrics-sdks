package com.readme.dataextraction.servlets.jakarta.userinfo;

import com.readme.dataextraction.UserDataExtractor;
import com.readme.dataextraction.UserDataField;
import com.readme.dataextraction.servlets.jakarta.JakartaHttpServletDataPayload;
import lombok.AllArgsConstructor;

@AllArgsConstructor
public class JakartaServletUserDataExtractor implements UserDataExtractor<JakartaHttpServletDataPayload> {

    @Override
    public String extractFromHeader(JakartaHttpServletDataPayload payload, UserDataField fieldName) {
        return "Field value from header";
    }

    @Override
    public String extractFromBody(JakartaHttpServletDataPayload payload, UserDataField fieldName) {
        return "Field value from body";
    }

    @Override
    public String extractFromJwt(JakartaHttpServletDataPayload payload, UserDataField fieldName) {
        return "Field value from jwt";
    }

}
