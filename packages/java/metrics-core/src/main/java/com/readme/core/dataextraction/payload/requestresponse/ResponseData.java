package com.readme.core.dataextraction.payload.requestresponse;

import lombok.Builder;
import lombok.Value;

import java.util.Map;

/**
 * Represents the details of an HTTP response captured for logging and analysis.
 * This class encapsulates key response attributes such as status code, headers,
 * response body, and status message.
 */
@Value
@Builder
public class ResponseData {

    /**
     * The response body sent back to the client.
     */
    String body;

    /**
     * A map of HTTP headers included in the response.
     */
    Map<String, String> headers;

    /**
     * The HTTP status code of the response (e.g., 200 for OK, 404 for Not Found).
     */
    int statusCode;

    /**
     * The status message associated with the response (e.g., "OK", "Bad Request").
     */
    String statusMessage;


}
