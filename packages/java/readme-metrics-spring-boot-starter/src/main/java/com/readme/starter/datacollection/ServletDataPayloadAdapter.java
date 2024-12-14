package com.readme.starter.datacollection;

import com.readme.dataextraction.DataPayloadAdapter;
import jakarta.servlet.http.HttpServletResponse;
import lombok.AllArgsConstructor;

import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;

import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@AllArgsConstructor
public class ServletDataPayloadAdapter implements DataPayloadAdapter {

    private HttpServletRequest request;
    private HttpServletResponse response;

    //TODO Do I need a separate method to get request parameters?

    @Override
    public String getRequestBody() {
        throw new UnsupportedOperationException("Not implemented yet");
    }

    /**
     * Retrieves all request headers from the {@link HttpServletRequest} and returns them
     * as a map where the header names are normalized to lowercase.
     *
     * <p>This method ensures consistent header name formatting by converting all
     * header names to lowercase, which is particularly useful for avoiding case-sensitivity
     * issues when accessing HTTP headers.</p>
     *
     * <p>Example:
     * If the request contains headers:
     * <ul>
     *     <li>Authorization: Bearer token</li>
     *     <li>X-User-Id: 12345</li>
     * </ul>
     * The resulting map will look like:
     * <pre>
     *     {
     *         "authorization": "Bearer token",
     *         "x-user-id": "12345"
     *     }
     * </pre>
     * </p>
     *
     * @return a map of request header names (lowercased) and their corresponding values.
     * If no headers are present or provided request is null, returns an empty map.
     */
    @Override
    public Map<String, String> getRequestHeaders() {
        if (request != null) {
            Map<String, String> headers = new HashMap<>();
            Enumeration<String> headerNames = request.getHeaderNames();

            while (headerNames.hasMoreElements()) {
                String headerName = headerNames.nextElement().toLowerCase();
                headers.put(headerName, request.getHeader(headerName));
            }
            return headers;
        }
        log.error("The provided request is null");
        return Collections.emptyMap();
    }

    @Override
    public String getResponseBody() {
        throw new UnsupportedOperationException("Not implemented yet");
    }

    /**
     * Retrieves all response headers from the {@link HttpServletResponse} and returns them
     * as a map where the header names are preserved in their original case.
     *
     * <p>This method iterates through all header names provided by the {@link HttpServletResponse}
     * and maps each header name to its corresponding value.</p>
     *
     * <p>Example:
     * If the response contains headers:
     * <ul>
     *     <li>Content-Type: application/json</li>
     *     <li>X-Custom-Header: custom-value</li>
     * </ul>
     * The resulting map will look like:
     * <pre>
     *     {
     *         "Content-Type": "application/json",
     *         "X-Custom-Header": "custom-value"
     *     }
     * </pre>
     * </p>
     *
     * @return a map of response header names and their corresponding values.
     * If no headers are present or provided response is null, returns an empty map.
     */
    @Override
    public Map<String, String> getResponseHeaders() {
        if (response != null) {
            return response.getHeaderNames().stream()
                    .collect(Collectors.toMap(
                            headerName -> headerName,
                            headerName -> response.getHeader(headerName)));
        }
        log.error("The provided response is null");
        return Collections.emptyMap();
    }

}
