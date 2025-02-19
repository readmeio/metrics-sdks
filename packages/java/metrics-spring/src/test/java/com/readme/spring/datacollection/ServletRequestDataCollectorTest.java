package com.readme.spring.datacollection;

import com.readme.core.dataextraction.payload.requestresponse.ApiCallLogData;
import com.readme.core.dataextraction.payload.requestresponse.RequestData;
import com.readme.core.dataextraction.payload.requestresponse.ResponseData;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import org.springframework.web.util.ContentCachingRequestWrapper;
import org.springframework.web.util.ContentCachingResponseWrapper;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

@ExtendWith(SpringExtension.class)
@ContextConfiguration(classes = {ServletRequestDataCollector.class})
class ServletRequestDataCollectorTest {

    @Autowired
    private ServletRequestDataCollector servletRequestDataCollector;

    @MockBean
    private ContentCachingRequestWrapper requestMock;

    @MockBean
    private ContentCachingResponseWrapper responseMock;

    @Test
    void collect_ShouldReturnApiCallLogData_WithCorrectRequestAndResponseData() {
        ServletDataPayloadAdapter dataPayload = createStubServletDataPayloadAdapter();

        ApiCallLogData result = servletRequestDataCollector.collect(dataPayload);

        assertNotNull(result);
        assertNotNull(result.getRequestData());
        assertNotNull(result.getResponseData());

        RequestData requestData = result.getRequestData();
        assertEquals("http://owl-bowl.abc", requestData.getUrl());
        assertEquals("GET", requestData.getMethod());
        assertEquals("HTTP/1.1", requestData.getProtocol());
        assertEquals("127.0.0.1", requestData.getRemoteAddress());
        assertEquals("{}", requestData.getBody());
        assertEquals("http://owl-bowl.abc", requestData.getRoutePath());
        assertEquals(Map.of("param1", "value1"), requestData.getRequestParameters());
        assertEquals(Map.of("authorization", "Bearer token"), requestData.getHeaders());

        ResponseData responseData = result.getResponseData();
        assertEquals("{\"status\":\"ok\"}", responseData.getBody());
        assertEquals(200, responseData.getStatusCode());
        assertEquals("OK", responseData.getStatusMessage());
        assertEquals(Map.of("content-type", "application/json"), responseData.getHeaders());
    }

    @Test
    void collect_ShouldHandleNullHeaders() {
        when(requestMock.getHeaderNames()).thenReturn(null);
        when(responseMock.getHeaderNames()).thenReturn(null);

        ServletDataPayloadAdapter dataPayloadAdapter = mock(ServletDataPayloadAdapter.class);
        ApiCallLogData result = servletRequestDataCollector.collect(dataPayloadAdapter);

        assertNotNull(result);
        assertTrue(result.getRequestData().getHeaders().isEmpty());
        assertTrue(result.getResponseData().getHeaders().isEmpty());
    }

    @Test
    void collect_ShouldHandleExceptionDuringRequestBodyRead() {
        ServletDataPayloadAdapter dataPayload = createStubServletDataPayloadAdapter();
        when(requestMock.getContentAsString()).thenThrow(new RuntimeException("Test exception"));

        ApiCallLogData result = servletRequestDataCollector.collect(dataPayload);

        assertNotNull(result);
        assertEquals("", result.getRequestData().getBody());
    }

    private ServletDataPayloadAdapter createStubServletDataPayloadAdapter() {
        when(requestMock.getMethod()).thenReturn("GET");
        when(requestMock.getContentType()).thenReturn("application/json");
        when(requestMock.getContentAsString()).thenReturn("{}");
        when(requestMock.getRemoteAddr()).thenReturn("127.0.0.1");
        when(requestMock.getProtocol()).thenReturn("HTTP/1.1");
        when(requestMock.getRequestURL()).thenReturn(new StringBuffer("http://owl-bowl.abc"));
        when(requestMock.getParameterMap()).thenReturn(Map.of("param1", new String[]{"value1"}));
        when(requestMock.getHeaderNames()).thenReturn(Collections.enumeration(List.of("authorization")));
        when(requestMock.getHeader("authorization")).thenReturn("Bearer token");

        when(responseMock.getContentAsByteArray()).thenReturn("{\"status\":\"ok\"}".getBytes());
        when(responseMock.getStatus()).thenReturn(200);
        when(responseMock.getHeaderNames()).thenReturn(Set.of("content-type"));
        when(responseMock.getHeader("content-type")).thenReturn("application/json");

        return new ServletDataPayloadAdapter(requestMock, responseMock);
    }
}