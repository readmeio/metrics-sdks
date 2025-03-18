package com.readme.core.dataextraction.payload;

import com.readme.core.dataextraction.payload.requestresponse.ApiCallLogData;
import com.readme.core.dataextraction.payload.user.UserData;
import lombok.Builder;
import lombok.Value;

import java.util.Date;

/**
 * Represents the complete payload for logging an API interaction, combining user-specific data, detailed API request
 * and response information, and precise timing metrics.
 */
@Builder
@Value
public class PayloadData {

    /**
     * Information identifying and describing the user making the API call.
     */
    UserData userData;

    /**
     * Detailed information about the API request and its corresponding response.
     */
    ApiCallLogData apiCallLogData;

    /**
     * Timestamp indicating the exact moment when the API request processing started.
     */
    Date requestStartedDateTime;

    /**
     * Timestamp indicating the exact moment when the API response processing completed.
     */
    Date responseEndDateTime;

}
