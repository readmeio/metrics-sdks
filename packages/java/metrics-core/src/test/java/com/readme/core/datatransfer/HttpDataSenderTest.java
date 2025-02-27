package com.readme.core.datatransfer;

import com.readme.core.config.CoreConfig;
import com.readme.core.dataextraction.LogOptions;
import com.readme.core.datatransfer.HttpDataSender;
import com.readme.core.datatransfer.OutgoingLogBody;
import com.readme.core.datatransfer.har.Group;
import com.readme.core.datatransfer.har.Har;
import com.readme.core.datatransfer.har.HarLog;
import okhttp3.*;
import org.jetbrains.annotations.NotNull;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.io.IOException;
import java.util.Base64;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.*;

public class HttpDataSenderTest {

    private OkHttpClient mockClient;
    private CoreConfig mockCoreConfig;
    private HttpDataSender httpDataSender;

    @BeforeEach
    public void setUp() {
        mockClient = mock(OkHttpClient.class);
        mockCoreConfig = mock(CoreConfig.class);
        when(mockCoreConfig.getReadmeAPIKey()).thenReturn("testApiKey");
        httpDataSender = new HttpDataSender(mockClient, mockCoreConfig);
    }

    @Test
    public void send_ShouldReturnTrue_WhenRequestIsSuccessful() throws IOException {
        Response mockResponse = mockResponse();
        Call mockCall = mock(Call.class);
        when(mockCall.execute()).thenReturn(mockResponse);
        when(mockClient.newCall(any(Request.class))).thenReturn(mockCall);
        List<OutgoingLogBody> payload = Collections.singletonList(createTestOutgoingLogBody());

        boolean result = httpDataSender.send(payload, LogOptions.builder().build());

        assertEquals(true, result);
    }

    @Test
    public void send_ShouldReturnFalse_WhenPayloadIsNull() {
        boolean result = httpDataSender.send(null, LogOptions.builder().build());

        assertEquals(false, result);
        verifyNoInteractions(mockClient);
    }

    //TODO fix this test
    @Test
    public void send_ShouldReturnFalse_WhenIOExceptionOccurs() throws IOException {
        Call mockCall = mock(Call.class);
        when(mockClient.newCall(any(Request.class))).thenReturn(mockCall);
        doThrow(new IOException("Test exception")).when(mockCall).execute();
        List<OutgoingLogBody> payload = Collections.singletonList(createTestOutgoingLogBody());

        boolean result = httpDataSender.send(payload, LogOptions.builder().fireAndForget(false).build());
        assertEquals(false, result);
    }

    @Test
    public void send_ShouldAddAuthorizationHeader() throws IOException {
        Response mockResponse = mock(Response.class);
        when(mockResponse.code()).thenReturn(200);
        Call mockCall = mock(Call.class);
        when(mockCall.execute()).thenReturn(mockResponse);
        when(mockClient.newCall(any(Request.class))).thenReturn(mockCall);

        List<OutgoingLogBody> payload = Collections.singletonList(createTestOutgoingLogBody());
        ArgumentCaptor<Request> requestCaptor = ArgumentCaptor.forClass(Request.class);

        httpDataSender.send(payload, LogOptions.builder().build());

        verify(mockClient).newCall(requestCaptor.capture());
        Request capturedRequest = requestCaptor.getValue();
        String authHeader = capturedRequest.header("Authorization");
        String expectedAuthHeader = "Basic " + Base64.getEncoder().encodeToString("testApiKey:".getBytes());
        assertEquals(expectedAuthHeader, authHeader);
    }

    private OutgoingLogBody createTestOutgoingLogBody() {
        return OutgoingLogBody.builder()
                .id(UUID.randomUUID())
                .version(1)
                .clientIPAddress("127.0.0.1")
                .development(true)
                .group(Group.builder().build())
                .request(new Har(HarLog.builder().build()))
                .build();
    }

    @NotNull
    private static Response mockResponse() {
        return new Response.Builder()
                .request(new Request.Builder().url("https://metrics.readme.io/v1/request").build())
                .code(200)
                .protocol(Protocol.HTTP_2)
                .message("OK")
                .body(ResponseBody.create("body content", MediaType.get("application/json")))
                .build();
    }


}
