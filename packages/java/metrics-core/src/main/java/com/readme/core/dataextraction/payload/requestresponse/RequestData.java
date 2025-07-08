package com.readme.core.dataextraction.payload.requestresponse;

import lombok.*;
import lombok.experimental.SuperBuilder;

import java.util.Map;

/**
 * Represents the details of an HTTP request captured for logging and analysis.
 * This class encapsulates key request attributes such as headers, query parameters,
 * request body, and metadata related to the request.
 */
@Data
@SuperBuilder
@EqualsAndHashCode
public class RequestData extends BaseRequestResponseData {

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
     * A map of query parameters extracted from the request URL.
     */
    private Map<String, String> requestParameters;

}
