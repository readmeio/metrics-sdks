package com.readme.datatransfer;

import com.readme.domain.RequestPayload;

public interface DataSender {

    String README_METRICS_URL = "https://metrics.readme.io/v1/request";

    int send(RequestPayload requestPayload);

}
