package com.readme.core.datatransfer;


import com.readme.core.datatransfer.BaseLogUrlFetcher;
import okhttp3.mockwebserver.MockResponse;
import okhttp3.mockwebserver.MockWebServer;
import okhttp3.mockwebserver.SocketPolicy;
import org.json.JSONObject;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.io.IOException;

import static org.junit.jupiter.api.Assertions.assertEquals;

class BaseLogUrlFetcherTest {

    private MockWebServer mockWebServer;

    @BeforeEach
    void setUp() throws IOException {
        mockWebServer = new MockWebServer();
        mockWebServer.start();
    }

    @AfterEach
    void tearDown() throws IOException {
        mockWebServer.shutdown();
    }

    @Test
    void fetchBaseLogUrl_ShouldReturnBaseUrl_WhenApiResponseIsSuccessful() {
        String expectedBaseUrl = "https://example.com/base";
        JSONObject jsonResponse = new JSONObject().put("baseUrl", expectedBaseUrl);
        mockWebServer.enqueue(new MockResponse()
                .setBody(jsonResponse.toString())
                .setResponseCode(200));

        String mockApiUrl = mockWebServer.url("/v1").toString();
        String result = BaseLogUrlFetcher.fetchBaseLogUrl("successApiKey", mockApiUrl);

        assertEquals(expectedBaseUrl, result);
    }

    @Test
    void fetchBaseLogUrl_ShouldReturnEmptyString_WhenApiResponseIsFailure() {
        mockWebServer.enqueue(new MockResponse()
                .setResponseCode(500)
                .setBody("Internal Server Error"));
        String mockApiUrl = mockWebServer.url("/v1").toString();
        String result = BaseLogUrlFetcher.fetchBaseLogUrl("failApiKey", mockApiUrl);

        assertEquals("", result);
    }

    @Test
    void fetchBaseLogUrl_ShouldReturnEmptyString_WhenExceptionOccurs() {
        mockWebServer.enqueue(new MockResponse().setSocketPolicy(SocketPolicy.DISCONNECT_AT_START));
        String mockApiUrl = mockWebServer.url("/v1").toString();
        String result = BaseLogUrlFetcher.fetchBaseLogUrl("exceptionApiKey", mockApiUrl);

        assertEquals("", result);
    }

}