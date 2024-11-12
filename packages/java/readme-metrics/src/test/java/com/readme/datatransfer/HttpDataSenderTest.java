package com.readme.datatransfer;

import com.readme.domain.RequestMetadata;
import com.readme.exception.EmptyRequestBodyException;
import okhttp3.*;
import org.jetbrains.annotations.NotNull;
import org.junit.Test;

import java.io.IOException;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertThrows;
import static org.mockito.Mockito.*;

public class HttpDataSenderTest {

    @Test
    public void testSendOnSuccess() throws IOException {
        OkHttpClient client = mock(OkHttpClient.class);
        Call call = mock(Call.class);
        Response response = mockResponse();
        RequestMetadata requestMetadata = mockRequestMetadata();

        when(client.newCall(any(Request.class))).thenReturn(call);
        when(call.execute()).thenReturn(response);
        HttpDataSender httpDataSender = new HttpDataSender(client);

        assertEquals(200, httpDataSender.send(requestMetadata));
    }

    @Test
    public void testSendOnBodyDoesntExist() throws IOException {
        OkHttpClient client = mock(OkHttpClient.class);
        Call call = mock(Call.class);
        Response response = mockResponse();
        RequestMetadata requestMetadata = RequestMetadata.builder().build();

        when(client.newCall(any(Request.class))).thenReturn(call);
        when(call.execute()).thenReturn(response);
        HttpDataSender httpDataSender = new HttpDataSender(client);

        assertThrows(EmptyRequestBodyException.class, () -> httpDataSender.send(requestMetadata));
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

    // TODO move to separate class
    private static RequestMetadata mockRequestMetadata() {
        return RequestMetadata.builder()
                .body("body")
                .build();
    }
}
