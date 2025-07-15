package com.readme.core.dataextraction.payload.requestresponse;

import lombok.Data;
import lombok.experimental.SuperBuilder;

import java.util.Map;

@Data
@SuperBuilder
public abstract class BaseRequestResponseData {

    /**
     * Request body prepared for logging
     */
    String body;

    /**
     * A map of HTTP headers included in the request.
     */
    Map<String, String> headers;

}
