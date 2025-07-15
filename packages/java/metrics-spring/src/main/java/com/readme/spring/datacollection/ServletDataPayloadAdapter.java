package com.readme.spring.datacollection;

import com.readme.core.dataextraction.DataPayloadAdapter;
import jakarta.servlet.http.HttpServletResponse;
import lombok.AllArgsConstructor;

import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.web.util.ContentCachingRequestWrapper;
import org.springframework.web.util.ContentCachingResponseWrapper;

import java.util.*;
import java.util.stream.Collectors;

/**
 * An implementation of {@link DataPayloadAdapter} that adapts a servlet-based HTTP request and response.
 * <p>
 * This class wraps {@link ContentCachingRequestWrapper} and {@link ContentCachingResponseWrapper}
 * to allow capturing the full content of HTTP requests and responses for logging and monitoring.
 */
@Slf4j
@AllArgsConstructor
public class ServletDataPayloadAdapter implements DataPayloadAdapter {

    private ContentCachingRequestWrapper request;
    private ContentCachingResponseWrapper response;

    /**
     * Returns the HTTP method of the request (e.g., GET, POST).
     */
    @Override
    public String getRequestMethod() {
        return request.getMethod();
    }


    /**
     * Returns the value of the Content-Type header from the request.
     */
    @Override
    public String getRequestContentType() {
        return request.getContentType();
    }

    /**
     * Retrieves the body of the request as a string.
     * <p>
     * If an error occurs while reading the request body, an empty string is returned and an error is logged.
     */
    @Override
    public String getRequestBody() {
        try {
            return request.getContentAsString();
        } catch (Exception e) {
            log.error("Error when trying to get request body: {}", e.getMessage());
        }
        return "";
    }

    /**
     * Returns the remote address (client IP) of the incoming request.
     */
    @Override
    public String getAddress() {
        return request.getRemoteAddr();
    }


    /**
     * Returns the protocol used for the request (e.g., HTTP/1.1).
     */
    @Override
    public String getProtocol() {
        return request.getProtocol();
    }

    /**
     * Returns the full URL that was requested.
     */
    @Override
    public String getUrl() {
        return request.getRequestURL().toString();
    }

    /**
     * Returns a map of request parameters where each parameter name is mapped to its joined value string.
     * <p>
     * Multi-valued parameters are joined using an empty string.
     */
    @Override
    public Map<String, String> getRequestParameters() {
        return request.getParameterMap()
                .entrySet()
                .stream()
                .collect(Collectors
                        .toMap(Map.Entry::getKey,
                                e -> String.join("", e.getValue())));
    }

    /**
     * Retrieves all request headers from the {@link HttpServletRequest} and returns them
     * as a map where the header names are normalized to lowercase.
     *
     * <p>This method ensures consistent header name formatting by converting all
     * header names to lowercase, which is particularly useful for avoiding case-sensitivity
     * issues when accessing HTTP headers.
     *
Example:
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

    /**
     * Retrieves the response body as a string.
     * <p>
     * If an error occurs while reading the response body, an empty string is returned and an error is logged.
     */
    @Override
    public String getResponseBody() {
        try {
            byte[] contentAsByteArray = response.getContentAsByteArray();
            return new String(contentAsByteArray);
        } catch (Exception e) {
            log.error("Error when trying to get response body: {}", e.getMessage());
        }
        return "";
    }

    /**
     * Returns the HTTP status code of the response (e.g., 200, 404).
     */
    @Override
    public int getStatusCode() {
        return response.getStatus();
    }


    /**
     * Returns the standard reason phrase for the response status code.
     * <p>
     * For example, 200 returns "OK", 404 returns "Not Found".
     * Returns an empty string if the status code is unrecognized.
     */
    @Override
    public String getStatusMessage() {
        HttpStatus httpStatus = HttpStatus.resolve(response.getStatus());
        return httpStatus != null ? httpStatus.getReasonPhrase() : "";
    }

    /**
     * Retrieves all response headers from the {@link HttpServletResponse} and returns them
     * as a map where the header names are preserved in their original case.
     *
     * <p>This method iterates through all header names provided by the {@link HttpServletResponse}
     * and maps each header name to its corresponding value.
     *
     * Example:
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
     *
     * @return a map of response header names and their corresponding values.
     * If no headers are present or provided response is null, returns an empty map.
     */
    @Override
    public Map<String, String> getResponseHeaders() {
        if (response != null) {
            return response.getHeaderNames().stream()
                    .collect(Collectors.toMap(
                            headerName -> headerName.toLowerCase(),
                            headerName -> response.getHeader(headerName)));
        }
        log.error("The provided response is null");
        return Collections.emptyMap();
    }

}
