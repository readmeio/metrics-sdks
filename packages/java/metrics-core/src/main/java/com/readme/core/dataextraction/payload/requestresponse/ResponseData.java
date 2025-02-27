package com.readme.core.dataextraction.payload.requestresponse;

import lombok.Builder;
import lombok.Value;

import java.util.Map;

@Value
@Builder
public class ResponseData {

    String body;
    Map<String, String> headers;
    int statusCode;
    String statusMessage;


}
