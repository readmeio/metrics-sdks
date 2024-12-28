package com.readme.dataextraction;

import java.util.Map;

/**
 * Represents a generic payload abstraction that provides methods to interact
 * with request and response data regardless of the underlying framework or implementation.
 * This interface allows seamless handling of HTTP-related data, enabling the
 * extraction of request and response headers, and bodies without tying the logic
 * to a specific framework or API (e.g., Servlet API, Spring WebFlux, Ktor, etc.).
 * <p>
 * Implementations of this interface should adapt their behavior based on the
 * specific HTTP processing framework they represent, but the consumer of this
 * interface does not need to be aware of these details.
 * </p>
 */
public interface DataPayloadAdapter {

    String getRequestMethod();
    String getRequestContentType();
    Map<String, String> getRequestHeaders();
    String getRequestBody();
    String getAddress();
    String getProtocol();
    String getUrl();


    Map<String, String> getResponseHeaders();
    String getResponseBody();
    Integer getStatusCode();
    String getStatusMessage();
}
