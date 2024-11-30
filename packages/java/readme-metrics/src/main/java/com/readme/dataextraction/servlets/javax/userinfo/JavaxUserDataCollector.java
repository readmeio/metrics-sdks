package com.readme.dataextraction.servlets.javax.userinfo;

import com.readme.dataextraction.UserDataCollector;
import com.readme.dataextraction.servlets.javax.JavaxHttpServletDataPayload;
import com.readme.domain.UserData;
import lombok.AllArgsConstructor;

@AllArgsConstructor
public class JavaxUserDataCollector implements UserDataCollector<JavaxHttpServletDataPayload> {

    @Override
    public UserData collect(JavaxHttpServletDataPayload javaxHttpServletDataPayload) {
        return null;
    }

}
