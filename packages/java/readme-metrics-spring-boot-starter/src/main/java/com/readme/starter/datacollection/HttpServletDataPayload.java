package com.readme.starter.datacollection;

import com.readme.dataextraction.DataPayload;
import jakarta.servlet.http.HttpServletResponse;
import lombok.AllArgsConstructor;

import jakarta.servlet.http.HttpServletRequest;
import java.util.Enumeration;

@AllArgsConstructor
public class HttpServletDataPayload implements DataPayload {

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
