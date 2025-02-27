package com.readme.core.dataextraction.payload;

import com.readme.core.dataextraction.payload.requestresponse.ApiCallLogData;
import com.readme.core.dataextraction.payload.user.UserData;
import lombok.Builder;
import lombok.Value;

import java.util.Date;

@Builder
@Value
public class PayloadData {

    UserData userData;
    ApiCallLogData apiCallLogData;
    Date requestStartedDateTime;
    Date responseEndDateTime;

}
