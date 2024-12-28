package com.readme.datatransfer;

import com.readme.config.CoreConfig;
import com.readme.dataextraction.payload.PayloadData;
import com.readme.dataextraction.payload.requestresponse.ApiCallLogData;
import okhttp3.*;
import org.jetbrains.annotations.NotNull;
import org.junit.Test;

import java.io.IOException;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertThrows;
import static org.mockito.Mockito.*;

public class HttpDataSenderTest {

    //TODO re-implement tests after all data collected and final data and classes structure are stable


//
//    @Test
//    public void testSendOnSuccess() throws IOException {
//        OkHttpClient client = mock(OkHttpClient.class);
//        Call call = mock(Call.class);
//        Response response = mockResponse();
//        PayloadData payloadData = mockRequestMetadata();
//
//        when(client.newCall(any(Request.class))).thenReturn(call);
//        when(call.execute()).thenReturn(response);
//        HttpDataSender httpDataSender = new HttpDataSender(client, mockCoreConfig());
//
//        assertEquals(200, httpDataSender.send(payloadData));
//    }
//
//    @NotNull
//    private static Response mockResponse() {
//        return new Response.Builder()
//                .request(new Request.Builder().url("https://metrics.readme.io/v1/request").build())
//                .code(200)
//                .protocol(Protocol.HTTP_2)
//                .message("OK")
//                .body(ResponseBody.create("body content", MediaType.get("application/json")))
//                .build();
//    }
//
//    private static PayloadData mockRequestMetadata() {
//        ApiCallLogData apiCallLogData = ApiCallLogData.builder()
//                .requestBody("body")
//                .responseBody("responseBody")
//                .routePath("routePath")
//                .build();
//        return PayloadData.builder()
//                .apiCallLogData(apiCallLogData)
//                .build();
//    }
//
//    private static CoreConfig mockCoreConfig() {
//        return CoreConfig.builder()
//                .readmeAPIKey("apikey")
//                .build();
//    }
}
