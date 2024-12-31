package com.readme.datatransfer;

import com.readme.dataextraction.LogOptions;
import com.readme.dataextraction.payload.PayloadData;
import com.readme.dataextraction.payload.requestresponse.ApiCallLogData;
import com.readme.dataextraction.payload.requestresponse.RequestData;
import com.readme.dataextraction.payload.requestresponse.ResponseData;
import com.readme.dataextraction.payload.user.UserData;
import com.readme.datatransfer.har.Group;
import com.readme.datatransfer.har.Har;
import com.readme.datatransfer.har.HarEntry;
import com.readme.datatransfer.har.HarLog;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Date;
import java.util.Map;

import static com.readme.dataextraction.ApiKeyMasker.mask;
import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
class OutgoingLogBodyConstructorTest {

    @InjectMocks
    private OutgoingLogBodyConstructor outgoingLogBodyConstructor;

    @Test
    void construct_ShouldBuildOutgoingLogBody_Success() {
        PayloadData payloadData = createStubPayloadData();
        LogOptions logOptions = createStubLogOptions();

        OutgoingLogBody result = outgoingLogBodyConstructor.construct(payloadData, logOptions);

        assertNotNull(result);
        assertEquals(payloadData.getApiCallLogData().getRequestData().getRemoteAddress(), result.getClientIPAddress());
        assertEquals(3, result.getVersion());
        assertTrue(result.isDevelopment());

        Group group = result.getGroup();
        assertNotNull(group);
        assertEquals(mask(payloadData.getUserData().getApiKey()), group.getId());
        assertEquals(payloadData.getUserData().getLabel(), group.getLabel());
        assertEquals(payloadData.getUserData().getEmail(), group.getEmail());

        Har har = result.getRequest();
        assertNotNull(har);
        HarLog harLog = har.getLog();
        assertNotNull(harLog);
        assertEquals("1.2", harLog.getVersion());
        assertEquals(1, harLog.getEntries().size());

        HarEntry harEntry = harLog.getEntries().get(0);
        assertEquals(payloadData.getApiCallLogData().getRequestData().getRoutePath(), harEntry.getPageRef());
        assertEquals(payloadData.getApiCallLogData().getResponseData().getStatusCode(), harEntry.getResponse().getStatus());
    }

    private PayloadData createStubPayloadData() {
        UserData userData = UserData.builder()
                .apiKey("owlApiKey")
                .email("owl@birdfact0ry.abc")
                .label("Owl Label")
                .build();

        RequestData requestData = RequestData.builder()
                .body("{\"key\":\"value\"}")
                .routePath("/owl/path")
                .remoteAddress("127.0.0.1")
                .protocol("HTTP/1.1")
                .url("http://owl-bowl.abc/api")
                .method("POST")
                .headers(Map.of("host", "owl-bowl.abc", "content-type", "application/json"))
                .requestParameters(Map.of("param1", "value1"))
                .build();

        ResponseData responseData = ResponseData.builder()
                .body("{\"response\":\"ok\"}")
                .headers(Map.of("content-type", "application/json", "content-length", "100"))
                .statusCode(200)
                .statusMessage("OK")
                .build();

        ApiCallLogData apiCallLogData = ApiCallLogData.builder()
                .requestData(requestData)
                .responseData(responseData)
                .build();

        return PayloadData.builder()
                .userData(userData)
                .apiCallLogData(apiCallLogData)
                .requestStartedDateTime(new Date(System.currentTimeMillis() - 1000))
                .responseEndDateTime(new Date())
                .build();
    }

    private LogOptions createStubLogOptions() {
        LogOptions logOptions = new LogOptions();
        logOptions.setDevelopment(true);
        return logOptions;
    }
}