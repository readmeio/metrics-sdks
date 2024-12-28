package com.readme.datatransfer;

import com.readme.dataextraction.payload.LogOptions;
import com.readme.dataextraction.payload.PayloadData;
import com.readme.datatransfer.har.OutgoingLogConstructor;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import java.util.Collections;

@Slf4j
@AllArgsConstructor
public class PayloadDataDispatcher {

    private DataSender dataSender;

    private OutgoingLogConstructor payloadConstructor;

    public void dispatch(PayloadData payloadData) {

        LogOptions logOptions = new LogOptions(); //TODO implement LogOptions

        //TODO Fix group id value (apiKey)
        OutgoingLogBody outgoingLogBody = payloadConstructor.constructPayload(payloadData, logOptions);
        dataSender.send(Collections.singletonList(outgoingLogBody));
    }


}
