package com.readme.dataextraction.servlets.javax.userinfo;

import com.readme.dataextraction.UserDataExtractor;
import com.readme.dataextraction.UserDataField;
import com.readme.dataextraction.servlets.javax.JavaxHttpServletDataPayload;
import lombok.AllArgsConstructor;

@AllArgsConstructor
public class JavaxServletUserDataExtractor implements UserDataExtractor<JavaxHttpServletDataPayload> {

    @Override
    public String extractFromHeader(JavaxHttpServletDataPayload payload, UserDataField fieldName) {
        return "Field value from header";
    }

    @Override
    public String extractFromBody(JavaxHttpServletDataPayload payload, UserDataField fieldName) {
        return "Field value from header";
    }

    @Override
    public String extractFromJwt(JavaxHttpServletDataPayload payload, UserDataField fieldName) {
        return "Field value from header";
    }

}
