package com.readme.datatransfer;

import com.readme.dataextraction.LogOptions;
import com.readme.dataextraction.payload.PayloadData;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import java.util.Collections;

@Slf4j
@AllArgsConstructor
public class PayloadDataDispatcher {

    private DataSender dataSender;

    private OutgoingLogBodyConstructor payloadConstructor;

    public void dispatch(PayloadData payloadData) {

        try {
            LogOptions logOptions = new LogOptions(); //TODO implement LogOptions

            OutgoingLogBody outgoingLogBody = payloadConstructor.construct(payloadData, logOptions);
            dataSender.send(Collections.singletonList(outgoingLogBody));
        } catch (Exception e) {
            log.error("Error occurred on data dispatch phase: {}", e.getMessage());
        }
    }


}
