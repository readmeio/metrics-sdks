package com.readme.dataextraction.payload.requestresponse;

import lombok.Builder;
import lombok.Value;

import java.util.Map;

@Value
@Builder
public class ApiCallLogData {

    RequestData requestData;
    ResponseData responseData;

}
