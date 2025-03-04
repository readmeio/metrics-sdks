package com.readme.core.datatransfer;

import com.readme.core.dataextraction.LogOptions;
import com.readme.core.dataextraction.payload.PayloadData;
import com.readme.core.dataextraction.payload.user.UserData;
import com.readme.core.datatransfer.DataSender;
import com.readme.core.datatransfer.OutgoingLogBody;
import com.readme.core.datatransfer.OutgoingLogBodyConstructor;
import com.readme.core.datatransfer.PayloadDataDispatcher;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.*;

class PayloadDataDispatcherTest {

    @Mock
    private DataSender dataSender;

    @Mock
    private OutgoingLogBodyConstructor payloadConstructor;

    @Captor
    private ArgumentCaptor<List<OutgoingLogBody>> outgoingLogBodiesCaptor;

    @InjectMocks
    private PayloadDataDispatcher payloadDataDispatcher;

    private PayloadData payloadData;
    private LogOptions logOptions;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        payloadDataDispatcher = new PayloadDataDispatcher(dataSender, payloadConstructor);
        payloadData = createStubPayloadData();
        logOptions = LogOptions.builder()
                .bufferLength(3)
                .build();
    }

    @Test
    void dispatch_ShouldAddToBufferAndSend_WhenBufferFull() {
        when(payloadConstructor.construct(payloadData, logOptions))
                .thenReturn(OutgoingLogBody.builder().build());
        when(dataSender.send(anyList(), eq(logOptions))).thenReturn(true);

        payloadDataDispatcher.dispatch(payloadData, logOptions);
        payloadDataDispatcher.dispatch(payloadData, logOptions);
        payloadDataDispatcher.dispatch(payloadData, logOptions);

        verify(dataSender, times(1))
                .send(outgoingLogBodiesCaptor.capture(), eq(logOptions));
        List<OutgoingLogBody> capturedBodies = outgoingLogBodiesCaptor.getValue();

        assertEquals(3, capturedBodies.size());
    }

    @Test
    void dispatch_ShouldNotSend_WhenBufferNotFull() {
        when(payloadConstructor.construct(payloadData, logOptions))
                .thenReturn(OutgoingLogBody.builder().build());

        payloadDataDispatcher.dispatch(payloadData, logOptions);
        payloadDataDispatcher.dispatch(payloadData, logOptions);

        verify(dataSender, never()).send(anyList(), eq(logOptions));
    }

    @Test
    void dispatch_ShouldHandleException_DuringDispatchPhase() {
        when(payloadConstructor.construct(payloadData, logOptions)).thenThrow(new RuntimeException("Construction error"));

        payloadDataDispatcher.dispatch(payloadData, logOptions);

        verifyNoInteractions(dataSender);
    }

    private PayloadData createStubPayloadData() {
        return PayloadData.builder()
                .userData(UserData.builder().apiKey("test-api-key").build())
                .build();
    }
}