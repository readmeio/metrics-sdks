package com.readme.core.datatransfer;

import com.readme.core.dataextraction.LogOptions;
import com.readme.core.dataextraction.payload.PayloadData;
import lombok.extern.slf4j.Slf4j;

import java.util.List;
import java.util.concurrent.BlockingQueue;
import java.util.concurrent.LinkedBlockingQueue;

@Slf4j
public class PayloadDataDispatcher {

    private DataSender dataSender;

    private OutgoingLogBodyConstructor payloadConstructor;

    private final BlockingQueue<OutgoingLogBody> buffer;

    public PayloadDataDispatcher(DataSender dataSender, OutgoingLogBodyConstructor payloadConstructor) {
        this.buffer = new LinkedBlockingQueue<>();
        this.dataSender = dataSender;
        this.payloadConstructor = payloadConstructor;
    }

    public void dispatch(PayloadData payloadData, LogOptions logOptions) {
        try {
            OutgoingLogBody outgoingLogBody = payloadConstructor.construct(payloadData, logOptions);
            buffer.add(outgoingLogBody);
            if (buffer.size() >= logOptions.getBufferLength()) {
                List<OutgoingLogBody> outgoingLogBodies = List.copyOf(buffer);
                if (dataSender.send(outgoingLogBodies, logOptions)) {
                    buffer.clear();
                } else {
                    log.error("Failed to send outgoing log body");
                }
            }
        } catch (Exception e) {
            log.error("Error occurred on data dispatch phase: {}", e.getMessage());
        }
    }

}
