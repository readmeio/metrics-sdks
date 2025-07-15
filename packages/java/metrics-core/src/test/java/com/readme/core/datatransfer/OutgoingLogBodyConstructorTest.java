package com.readme.core.datatransfer;

import com.readme.core.dataextraction.LogOptions;
import com.readme.core.dataextraction.payload.PayloadData;
import com.readme.core.dataextraction.payload.requestresponse.ApiCallLogData;
import com.readme.core.dataextraction.payload.requestresponse.RequestData;
import com.readme.core.dataextraction.payload.requestresponse.ResponseData;
import com.readme.core.dataextraction.payload.user.UserData;
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
                .headers(new HashMap<>(Map.of("host", "owl-bowl.abc")))
                .requestParameters(Map.of("param1", "value1"))
                .build();

        ResponseData responseData = ResponseData.builder()
                .body("{\"response\":\"ok\"}")
                .headers(new HashMap<>(Map.of("host", "owl-bowl.abc")))
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
        payloadData.getApiCallLogData().getRequestData().getHeaders().put("content-type", "application/json");

        payloadData.getApiCallLogData().getResponseData().setBody("{\"key\":\"value\", \"secret\":\"mySecret\"}");
        payloadData.getApiCallLogData().getResponseData().getHeaders().put("X-Secret-Header", "SuperSecret");
        payloadData.getApiCallLogData().getResponseData().getHeaders().put("content-type", "application/json");

        LogOptions logOptions = LogOptions.builder()
                .development(true)
                .denylist(List.of("secret", "X-Secret-Header"))
                .build();

        OutgoingLogBody result = outgoingLogBodyConstructor.construct(payloadData, logOptions);

        Har har = result.getRequest();
        HarEntry entry = har.getLog().getEntries().get(0);
        HarRequest request = entry.getRequest();
        HarResponse response = entry.getResponse();

        String requestBody = request.getPostData().getText();
        assertNotNull(requestBody);
        assertTrue(requestBody.contains("\"secret\":\"[REDACTED]\""));

        String responseBody = response.getContent().getText();
        assertNotNull(responseBody);
        assertTrue(responseBody.contains("\"secret\":\"[REDACTED]\""));

        boolean anySecretHeader = request.getHeaders().stream()
                .anyMatch(hdr -> hdr.getName().equals("X-Secret-Header"));
        assertFalse(anySecretHeader);
    }

    @Test
    void construct_ShouldApplyLogOptionsAllowList() {
        PayloadData payloadData = createStubPayloadData();
        payloadData.getApiCallLogData().getRequestData().setBody("{\"keep\":\"abc\", \"drop\":\"xyz\"}");
        payloadData.getApiCallLogData().getRequestData().getHeaders().put("Keep-header", "keepValue");
        payloadData.getApiCallLogData().getRequestData().getHeaders().put("Drop-Header", "dropValue");
        payloadData.getApiCallLogData().getRequestData().getHeaders().put("content-type", "application/json");

        payloadData.getApiCallLogData().getResponseData().setBody("{\"keep\":\"abc\", \"drop\":\"xyz\"}");
        payloadData.getApiCallLogData().getResponseData().getHeaders().put("Keep-header", "keepValue");
        payloadData.getApiCallLogData().getResponseData().getHeaders().put("Drop-Header", "dropValue");
        payloadData.getApiCallLogData().getResponseData().getHeaders().put("content-type", "application/json");

        LogOptions logOptions = LogOptions.builder()
                .development(false)
                .allowlist(List.of("keep", "Keep-Header"))
                .build();

        OutgoingLogBody result = outgoingLogBodyConstructor.construct(payloadData, logOptions);

        Har har = result.getRequest();
        HarEntry entry = har.getLog().getEntries().get(0);
        HarRequest request = entry.getRequest();
        HarResponse response = entry.getResponse();
        String requestBody = request.getPostData().getText();
        String responseBody = response.getContent().getText();

        assertTrue(requestBody.contains("\"keep\":\"abc\""));
        assertFalse(requestBody.contains("drop"));

        assertTrue(responseBody.contains("\"keep\":\"abc\""));
        assertFalse(responseBody.contains("drop"));

        boolean keepHeaderExists = request.getHeaders().stream()
                .anyMatch(hdr -> hdr.getName().equals("Keep-header"));
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

    @Test
    void construct_ShouldApplyFormUrlEncodedDenyList() {
        PayloadData payloadData = createStubPayloadData();
        payloadData.getApiCallLogData().getRequestData().setBody("username=owl&password=superSecret123&token=myToken");
        payloadData.getApiCallLogData().getRequestData().getHeaders().put("content-type", "application/x-www-form-urlencoded");
        payloadData.getApiCallLogData().getResponseData().setBody("username=owl&password=superSecret123&token=myToken");
        payloadData.getApiCallLogData().getResponseData().getHeaders().put("content-type", "application/x-www-form-urlencoded");

        LogOptions logOptions = LogOptions.builder()
                .development(true)
                .denylist(List.of("password", "token"))
                .build();

        OutgoingLogBody result = outgoingLogBodyConstructor.construct(payloadData, logOptions);

        Har har = result.getRequest();
        HarEntry entry = har.getLog().getEntries().get(0);

        String requestBody = entry.getRequest().getPostData().getText();
        String responseBody = entry.getResponse().getContent().getText();

        boolean dropHeaderExistsInRequest = entry.getRequest().getHeaders().stream()
                .anyMatch(hdr -> hdr.getName().equals("Drop-Header"));
        assertFalse(dropHeaderExistsInRequest);

        boolean dropHeaderExistsInResponse = entry.getResponse().getHeaders().stream()
                .anyMatch(hdr -> hdr.getName().equals("Drop-Header"));
        assertFalse(dropHeaderExistsInResponse);

        assertTrue(requestBody.contains("username=owl"));
        assertTrue(requestBody.contains("password=[REDACTED]"));
        assertTrue(requestBody.contains("token=[REDACTED]"));

        assertTrue(responseBody.contains("username=owl"));
        assertTrue(responseBody.contains("password=[REDACTED]"));
        assertTrue(responseBody.contains("token=[REDACTED]"));
    }

    @Test
    void construct_ShouldApplyFormUrlEncodedAllowList() {
        PayloadData payloadData = createStubPayloadData();
        payloadData.getApiCallLogData().getRequestData().setBody("username=owl&password=superSecret123&token=myToken");
        payloadData.getApiCallLogData().getRequestData().getHeaders().put("content-type", "application/x-www-form-urlencoded");
        payloadData.getApiCallLogData().getResponseData().setBody("username=owl&password=superSecret123&token=myToken");
        payloadData.getApiCallLogData().getResponseData().getHeaders().put("content-type", "application/x-www-form-urlencoded");

        LogOptions logOptions = LogOptions.builder()
                .development(false)
                .allowlist(List.of("username"))
                .build();

        OutgoingLogBody result = outgoingLogBodyConstructor.construct(payloadData, logOptions);

        Har har = result.getRequest();
        HarEntry entry = har.getLog().getEntries().get(0);
        String requestBody = entry.getRequest().getPostData().getText();
        String responseBody = entry.getResponse().getContent().getText();

        assertTrue(requestBody.contains("username=owl"));
        assertFalse(requestBody.contains("password"));
        assertFalse(requestBody.contains("token"));

        assertTrue(responseBody.contains("username=owl"));
        assertFalse(responseBody.contains("password"));
        assertFalse(responseBody.contains("token"));
    }


    @Test
    void construct_ShouldApplyLogOptionsDenyList_WhenContentTypeIsMissing() {
        PayloadData payloadData = createStubPayloadData();
        payloadData.getApiCallLogData().getRequestData().getHeaders().put("X-Secret-Header", "SuperSecret");
        payloadData.getApiCallLogData().getResponseData().getHeaders().put("X-Secret-Header", "SuperSecret");

        LogOptions logOptions = LogOptions.builder()
                .development(true)
                .denylist(List.of("X-Secret-Header", "secret"))
                .build();

        OutgoingLogBody result = outgoingLogBodyConstructor.construct(payloadData, logOptions);

        Har har = result.getRequest();
        HarEntry entry = har.getLog().getEntries().get(0);

        HarRequest request = entry.getRequest();
        HarResponse response = entry.getResponse();

        boolean anySecretHeaderInRequest = request.getHeaders().stream()
                .anyMatch(hdr -> hdr.getName().equalsIgnoreCase("X-Secret-Header"));
        assertFalse(anySecretHeaderInRequest);

        boolean anySecretHeaderInResponse = response.getHeaders().stream()
                .anyMatch(hdr -> hdr.getName().equalsIgnoreCase("X-Secret-Header"));
        assertFalse(anySecretHeaderInResponse);
    }

    @Test
    void construct_ShouldApplyLogOptionsAllowList_WhenContentTypeIsMissing() {
        PayloadData payloadData = createStubPayloadData();
        payloadData.getApiCallLogData().getRequestData().getHeaders().put("Keep-Header", "keepValue");
        payloadData.getApiCallLogData().getRequestData().getHeaders().put("Drop-Header", "dropValue");
        payloadData.getApiCallLogData().getResponseData().getHeaders().put("Keep-Header", "keepValue");
        payloadData.getApiCallLogData().getResponseData().getHeaders().put("Drop-Header", "dropValue");

        LogOptions logOptions = LogOptions.builder()
                .development(true)
                .allowlist(List.of("Keep-Header", "keep"))
                .build();

        OutgoingLogBody result = outgoingLogBodyConstructor.construct(payloadData, logOptions);

        Har har = result.getRequest();
        HarEntry entry = har.getLog().getEntries().get(0);

        HarRequest request = entry.getRequest();
        HarResponse response = entry.getResponse();

        boolean dropHeaderExistsInRequest = entry.getRequest().getHeaders().stream()
                .anyMatch(hdr -> hdr.getName().equals("Drop-Header"));
        assertFalse(dropHeaderExistsInRequest);

        boolean dropHeaderExistsInResponse = entry.getResponse().getHeaders().stream()
                .anyMatch(hdr -> hdr.getName().equals("Drop-Header"));
        assertFalse(dropHeaderExistsInResponse);

    }
}