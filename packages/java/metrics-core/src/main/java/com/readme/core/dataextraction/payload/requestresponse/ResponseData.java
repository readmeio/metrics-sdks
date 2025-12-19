package com.readme.core.dataextraction.payload.requestresponse;

import lombok.*;
import lombok.experimental.SuperBuilder;

import java.util.Map;

/**
 * Represents the details of an HTTP response captured for logging and analysis.
 * This class encapsulates key response attributes such as status code, headers,
 * response body, and status message.
 */
@Data
@SuperBuilder
@EqualsAndHashCode
public class ResponseData extends BaseRequestResponseData {
    /**
     * The HTTP status code of the response (e.g., 200 for OK, 404 for Not Found).
     */
    int statusCode;

    /**
     * The status message associated with the response (e.g., "OK", "Bad Request").
     */
    String statusMessage;


}
