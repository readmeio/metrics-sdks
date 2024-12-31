package com.readme.dataextraction.payload;

import com.readme.dataextraction.payload.requestresponse.ApiCallLogData;
import com.readme.dataextraction.payload.user.UserData;
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
