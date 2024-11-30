package com.readme.dataextraction.servlets.javax;

import com.readme.dataextraction.RequestDataCollector;
import com.readme.domain.UserData;

public class JavaxServletRequestDataCollector implements RequestDataCollector<JavaxHttpServletDataPayload> {

    @Override
    public void collect(JavaxHttpServletDataPayload javaxHttpServletDataPayload, UserData userData) {
        throw new UnsupportedOperationException("Not implemented yet");
    }

}
