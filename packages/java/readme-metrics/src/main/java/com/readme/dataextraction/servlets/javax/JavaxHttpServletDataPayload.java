package com.readme.dataextraction.servlets.javax;

import com.readme.dataextraction.servlets.HttpServletDataPayload;
import lombok.AllArgsConstructor;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.util.Enumeration;

@AllArgsConstructor
public class JavaxHttpServletDataPayload implements HttpServletDataPayload {

    private HttpServletRequest request;
    private HttpServletResponse response;

    @Override
    public String getRequestBody() {
        throw new UnsupportedOperationException("Not implemented yet");
    }

    @Override
    public Enumeration<String> getRequestHeaders() {
        throw new UnsupportedOperationException("Not implemented yet");
    }

    @Override
    public String getResponseBody() {
        throw new UnsupportedOperationException("Not implemented yet");
    }

    @Override
    public Enumeration<String> getResponseHeaders() {
        throw new UnsupportedOperationException("Not implemented yet");
    }

}
