package com.readme.dataextraction.payload;

import com.readme.dataextraction.payload.requestresponse.ApiCallLogData;
import com.readme.dataextraction.user.UserData;
import lombok.Builder;
import lombok.Value;

import java.util.Date;
import java.util.UUID;

@Builder
@Value
public class PayloadData {

    UUID logId;
    UserData userData;
    ApiCallLogData apiCallLogData;
    Date requestStartedDateTime;
    Date responseEndDateTime;

}
