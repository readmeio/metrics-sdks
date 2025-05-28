package com.readme.core.dataextraction.payload.requestresponse;

import lombok.Builder;
import lombok.Data;
import lombok.Setter;
import lombok.Value;

import java.util.Map;

/**
 * Represents the details of an HTTP request captured for logging and analysis.
 * This class encapsulates key request attributes such as headers, query parameters,
 * request body, and metadata related to the request.
 */
@Data
@Builder
public class RequestData {

    /**
     * Request body prepared for logging
     */
    private String body;

    /**
     * The route path associated with the request (e.g., "/api/v1/resource").
     */
    private String routePath;

    /**
     * The remote IP address of the client making the request.
     */
    private String remoteAddress;

    /**
     * The protocol used in the request (e.g., "HTTP/1.1" or "HTTP/2").
     */
    private String protocol;

    /**
     * The full URL of the request, including query parameters.
     */
    private String url;

    /**
     * The HTTP method used in the request (e.g., "GET", "POST", "PUT").
     */
    private String method;

    /**
     * A map of HTTP headers included in the request.
     */
    private Map<String, String> headers;

    /**
     * A map of query parameters extracted from the request URL.
     */
    private Map<String, String> requestParameters;


}
