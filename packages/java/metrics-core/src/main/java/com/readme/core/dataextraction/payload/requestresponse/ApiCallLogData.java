package com.readme.core.dataextraction.payload.requestresponse;

import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class ApiCallLogData {

    RequestData requestData;
    ResponseData responseData;

}
