package com.readme.core.datatransfer;

import com.readme.core.dataextraction.LogOptions;

import java.util.List;

public interface DataSender {


    boolean send(List<OutgoingLogBody> payloadData, LogOptions logOptions);

}
