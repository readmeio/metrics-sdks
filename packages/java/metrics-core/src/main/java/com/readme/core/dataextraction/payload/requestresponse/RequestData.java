package com.readme.core.dataextraction.payload.requestresponse;

import lombok.Builder;
import lombok.Data;
import lombok.Setter;
import lombok.Value;

import java.util.Map;

@Data
@Builder
public class RequestData {

    private String body;
    private String routePath;
    private String remoteAddress;
    private String protocol;
    private String url;
    private String method;
    private Map<String, String> headers;
    private Map<String, String> requestParameters;


}
