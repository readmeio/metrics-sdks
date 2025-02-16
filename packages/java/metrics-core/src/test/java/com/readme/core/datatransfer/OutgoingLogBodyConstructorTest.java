package com.readme.core.datatransfer;

import com.readme.core.dataextraction.LogOptions;
import com.readme.core.dataextraction.payload.PayloadData;
import com.readme.core.dataextraction.payload.requestresponse.ApiCallLogData;
import com.readme.core.dataextraction.payload.requestresponse.RequestData;
import com.readme.core.dataextraction.payload.requestresponse.ResponseData;
import com.readme.core.dataextraction.payload.user.UserData;
import com.readme.core.datatransfer.OutgoingLogBody;
import com.readme.core.datatransfer.OutgoingLogBodyConstructor;
import com.readme.core.datatransfer.har.*;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static com.readme.core.dataextraction.ApiKeyMasker.mask;
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
                .headers(new HashMap<>(Map.of("host", "owl-bowl.abc", "content-type", "application/json")))
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

    @Test
    void construct_ShouldApplyLogOptionsDenyList() {
        PayloadData payloadData = createStubPayloadData();
        payloadData.getApiCallLogData().getRequestData().setBody("{\"key\":\"value\", \"secret\":\"mySecret\"}");
        payloadData.getApiCallLogData().getRequestData().getHeaders().put("X-Secret-Header", "SuperSecret");

        LogOptions logOptions = LogOptions.builder()
                .development(true)
                .denylist(List.of("secret", "X-Secret-Header"))
                .build();

        OutgoingLogBody result = outgoingLogBodyConstructor.construct(payloadData, logOptions);

        Har har = result.getRequest();
        HarEntry entry = har.getLog().getEntries().get(0);
        HarRequest request = entry.getRequest();

        HarPostData postData = request.getPostData();
        assertNotNull(postData);
        assertTrue(postData.getText().contains("\"secret\":\"[REDACTED]\""));

        boolean anySecretHeader = request.getHeaders().stream()
                .anyMatch(hdr -> hdr.getName().equals("X-Secret-Header"));
        assertFalse(anySecretHeader);
    }

    @Test
    void construct_ShouldApplyLogOptionsAllowList() {
        PayloadData payloadData = createStubPayloadData();
        payloadData.getApiCallLogData().getRequestData().setBody("{\"keep\":\"abc\", \"drop\":\"xyz\"}");
        payloadData.getApiCallLogData().getRequestData().getHeaders().put("Keep-Header", "keepValue");
        payloadData.getApiCallLogData().getRequestData().getHeaders().put("Drop-Header", "dropValue");

        LogOptions logOptions = LogOptions.builder()
                .development(false)
                .allowlist(List.of("keep", "Keep-Header"))
                .build();

        OutgoingLogBody result = outgoingLogBodyConstructor.construct(payloadData, logOptions);

        Har har = result.getRequest();
        HarEntry entry = har.getLog().getEntries().get(0);
        HarRequest request = entry.getRequest();
        HarPostData postData = request.getPostData();

        assertTrue(postData.getText().contains("\"keep\":\"abc\""));
        assertFalse(postData.getText().contains("drop"));

        boolean keepHeaderExists = request.getHeaders().stream()
                .anyMatch(hdr -> hdr.getName().equals("Keep-Header"));
        assertTrue(keepHeaderExists);

        boolean dropHeaderExists = request.getHeaders().stream()
                .anyMatch(hdr -> hdr.getName().equals("Drop-Header"));
        assertFalse(dropHeaderExists );
    }

    private LogOptions createStubLogOptions() {
        return LogOptions.builder()
                .development(true)
                .build();
    }
}