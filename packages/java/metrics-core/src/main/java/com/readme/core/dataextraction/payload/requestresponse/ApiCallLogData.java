package com.readme.core.dataextraction.payload.requestresponse;

import lombok.Builder;
import lombok.Value;

/**
 * Encapsulates the details of an API call for logging and monitoring purposes.
 * This class serves as a wrapper for both the request and response data,
 * providing a structured format for capturing and analyzing HTTP interactions.
 */
@Value
@Builder
public class ApiCallLogData {

    /**
     * The HTTP request data associated with the API call.
     */
    RequestData requestData;

    /**
     * The HTTP response data associated with the API call.
     */
    ResponseData responseData;

}
