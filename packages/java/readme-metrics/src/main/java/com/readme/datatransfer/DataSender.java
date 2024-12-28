package com.readme.datatransfer;

import java.util.List;

public interface DataSender {

    String README_METRICS_URL = "https://metrics.readme.io/v1/request";

    int send(List<OutgoingLogBody> payloadData);

}
