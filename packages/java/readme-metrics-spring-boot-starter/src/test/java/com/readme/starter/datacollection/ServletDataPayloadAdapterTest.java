package com.readme.starter.datacollection;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.web.util.ContentCachingRequestWrapper;
import org.springframework.web.util.ContentCachingResponseWrapper;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.StringReader;
import java.util.Collections;
import java.util.Enumeration;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@Disabled
class ServletDataPayloadAdapterTest {

    @Mock
    private ContentCachingRequestWrapper requestMock;

    @Mock
    private ContentCachingResponseWrapper responseMock;

    private ServletDataPayloadAdapter adapter;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        adapter = new ServletDataPayloadAdapter(requestMock, responseMock);
    }


    // --------------------------- REQUEST --------------------------------

    @Test
    void getRequestHeaders_HappyPath_ReturnsAllHeaders() {
        String usernameHeader = "X-User-Name".toLowerCase();
        String userIdHeader = "X-User-Id".toLowerCase();
        Enumeration<String> headerNames = Collections.enumeration(List.of(usernameHeader, userIdHeader));

        when(requestMock.getHeaderNames()).thenReturn(headerNames);
        when(requestMock.getHeader(usernameHeader)).thenReturn("Parrot");
        when(requestMock.getHeader(userIdHeader)).thenReturn("parrot@birdfact0ry.abc");

        Map<String, String> headers = adapter.getRequestHeaders();

        assertEquals(2, headers.size());
        assertEquals("Parrot", headers.get(usernameHeader));
        assertEquals("parrot@birdfact0ry.abc", headers.get(userIdHeader));
    }

    @Test
    void getRequestHeaders_NoHeaders_ReturnsEmptyMap() {
        when(requestMock.getHeaderNames()).thenReturn(Collections.emptyEnumeration());
        Map<String, String> headers = adapter.getRequestHeaders();

        assertTrue(headers.isEmpty());
    }

    @Test
    void getRequestMethod_HappyPath_ReturnsCorrectMethod() {
        when(requestMock.getMethod()).thenReturn("POST");
        String method = adapter.getRequestMethod();

        assertEquals("POST", method);
    }

    @Test
    void getRequestContentType_HappyPath_ReturnsContentType() {
        when(requestMock.getContentType()).thenReturn("application/json");
        String contentType = adapter.getRequestContentType();

        assertEquals("application/json", contentType);
    }

    @Test
    void getRequestBody_HappyPath_ReturnsRequestBody() throws IOException {
        String requestBody = "{\"bird\": \"Owl\"}";
        byte[] bodyAsBytes = requestBody.getBytes();
        when(requestMock.getContentAsByteArray()).thenReturn(bodyAsBytes);
        String result = adapter.getRequestBody();

        assertEquals(requestBody, result);
    }

    @Test
    void getRequestBody_WhenIOExceptionOccurs_ReturnsEmptyString() throws IOException {
        when(requestMock.getReader()).thenThrow(new IOException("Failed to read request"));
        String result = adapter.getRequestBody();

        assertEquals("", result);
    }

    // --------------------------- RESPONSE --------------------------------
    @Test
    void getResponseHeaders_HappyPath_ReturnsAllHeaders() {
        String usernameHeader = "Response-X-User-Name".toLowerCase();
        String userIdHeader = "Response-X-User-Id".toLowerCase();

        when(responseMock.getHeaderNames()).thenReturn(List.of(usernameHeader, userIdHeader));
        when(responseMock.getHeader(usernameHeader)).thenReturn("Parrot");
        when(responseMock.getHeader(userIdHeader)).thenReturn("parrot@birdfact0ry.abc");

        Map<String, String> headers = adapter.getResponseHeaders();

        assertEquals(2, headers.size());
        assertEquals("Parrot", headers.get(usernameHeader));
        assertEquals("parrot@birdfact0ry.abc", headers.get(userIdHeader));
    }

    // TODO implement this, once it fails
    @Test
    void getResponseBody_ThrowsUnsupportedOperationException() {
        UnsupportedOperationException exception = assertThrows(
                UnsupportedOperationException.class,
                adapter::getResponseBody
        );

        assertEquals("Not implemented yet", exception.getMessage());
    }

    @Test
    void getResponseHeaders_NoHeaders_ReturnsEmptyMap() {
        when(responseMock.getHeaderNames()).thenReturn(Collections.emptyList());
        Map<String, String> headers = adapter.getResponseHeaders();

        assertTrue(headers.isEmpty());
    }


}