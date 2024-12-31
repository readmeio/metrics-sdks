package com.readme.dataextraction.payload.requestresponse;

import lombok.Builder;
import lombok.Value;

import java.util.Map;

@Value
@Builder
public class RequestData {

    String body;
    String routePath;
    String remoteAddress;
    String protocol;
    String url;
    String method;
    Map<String, String> headers;
    Map<String, String> requestParameters;


}
