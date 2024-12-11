package com.readme.starter.datacollection;

import com.readme.dataextraction.DataPayloadAdapter;
import jakarta.servlet.http.HttpServletResponse;
import lombok.AllArgsConstructor;

import jakarta.servlet.http.HttpServletRequest;

import java.util.*;
import java.util.stream.Collectors;

@AllArgsConstructor
public class ServletDataPayloadAdapter implements DataPayloadAdapter {

    private HttpServletRequest request;
    private HttpServletResponse response;

    //TODO Do I need a separate method to get request parameters?

    @Override
    public String getRequestBody() {
        throw new UnsupportedOperationException("Not implemented yet");
    }

    @Override
    public Map<String, String> getRequestHeaders() {
        Map<String, String> headers = new HashMap<>();
        Enumeration<String> headerNames = request.getHeaderNames();
        while(headerNames.hasMoreElements()) {
            String headerName = headerNames.nextElement().toLowerCase();
            headers.put(headerName, request.getHeader(headerName));
        }
        return headers;
    }

    @Override
    public String getResponseBody() {
        throw new UnsupportedOperationException("Not implemented yet");
    }

    @Override
    public Map<String, String>  getResponseHeaders() {
        return response.getHeaderNames().stream()
                .collect(Collectors.toMap(
                        headerName -> headerName,
                        headerName -> response.getHeader(headerName)));
    }

}
