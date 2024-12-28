package com.readme.dataextraction.payload.requestresponse;

import lombok.Builder;
import lombok.Value;

import java.util.Map;

@Value
@Builder
public class ResponseData {

    String body;
    Map<String, String> headers;
    Integer statusCode;
    String statusMessage;


}
