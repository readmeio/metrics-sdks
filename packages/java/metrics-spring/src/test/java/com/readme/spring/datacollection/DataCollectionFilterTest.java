package com.readme.spring.datacollection;

import com.readme.core.dataextraction.LogOptions;
import com.readme.core.dataextraction.payload.requestresponse.RequestDataCollector;
import com.readme.core.dataextraction.payload.user.UserData;
import com.readme.core.dataextraction.payload.user.UserDataCollector;
import com.readme.core.datatransfer.PayloadDataDispatcher;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.*;
import org.springframework.web.util.ContentCachingRequestWrapper;
import org.springframework.web.util.ContentCachingResponseWrapper;

import java.io.IOException;

import static org.mockito.Mockito.*;

class DataCollectionFilterTest {

    @Mock
    private RequestDataCollector<ServletDataPayloadAdapter> requestDataCollector;

    @Mock
    private UserDataCollector<ServletDataPayloadAdapter> userDataCollector;

    @Mock
    private HttpServletRequest request;

    @Mock
    private HttpServletResponse response;

    @Mock
    private FilterChain chain;

    @Mock
    private PayloadDataDispatcher payloadDataDispatcher;

    private DataCollectionFilter filter;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        filter = new DataCollectionFilter(userDataCollector, requestDataCollector, payloadDataDispatcher, LogOptions.builder().build());
    }

    @Test
    void doFilter_OptionsRequest_ShouldPassThroughWithoutProcessing() throws Exception {
        when(request.getMethod()).thenReturn("OPTIONS");

        filter.doFilter(request, response, chain);

        verify(chain).doFilter(request, response);
        verifyNoInteractions(requestDataCollector, userDataCollector);
    }


    @Test
    void doFilter_GetRequest_ShouldProcessAndCollectData() throws Exception {
        when(request.getMethod()).thenReturn("GET");
        testChain();
    }

    @Test
    void doFilter_PutRequest_ShouldProcessAndCollectData() throws Exception {
        when(request.getMethod()).thenReturn("PUT");
        testChain();
    }

    @Test
    void doFilter_PostRequest_ShouldProcessAndCollectData() throws Exception {
        when(request.getMethod()).thenReturn("POST");
        testChain();
    }

    @Test
    void doFilter_PatchRequest_ShouldProcessAndCollectData() throws Exception {
        when(request.getMethod()).thenReturn("PATCH");
        testChain();
    }

    @Test
    void doFilter_DeleteRequest_ShouldProcessAndCollectData() throws Exception {
        when(request.getMethod()).thenReturn("DELETE");
        testChain();
    }


    private void testChain() throws IOException, ServletException {
        UserData userData = getMockedUserData();
        when(userDataCollector.collect(any(ServletDataPayloadAdapter.class))).thenReturn(userData);

        filter.doFilter(request, response, chain);

        verify(chain).doFilter(any(ContentCachingRequestWrapper.class), any(ContentCachingResponseWrapper.class));

        ArgumentCaptor<ServletDataPayloadAdapter> payloadCaptor = ArgumentCaptor.forClass(ServletDataPayloadAdapter.class);

        verify(userDataCollector).collect(payloadCaptor.capture());
        verify(requestDataCollector).collect(eq(payloadCaptor.getValue()));

        // TODO Verify response body is copied
        // verify(response).getOutputStream();
    }

    private static UserData getMockedUserData() {
        return UserData.builder()
                .apiKey("Owl")
                .email("owl@birdfactory.abc")
                .label("owl-label")
                .build();
    }

    @Test
    void doFilter_UserDataCollectorThrowsException_ShouldHandleExceptionAndContinueFlow() throws Exception {
        when(request.getMethod()).thenReturn("POST");
        when(userDataCollector.collect(any(ServletDataPayloadAdapter.class)))
                .thenThrow(new RuntimeException("Error in UserDataCollector"));

        filter.doFilter(request, response, chain);

        verify(chain).doFilter(any(ContentCachingRequestWrapper.class), any(ContentCachingResponseWrapper.class));
        verify(requestDataCollector, never()).collect(any());
        verifyNoMoreInteractions(requestDataCollector);
    }

    @Test
    void doFilter_RequestDataCollectorThrowsException_ShouldHandleExceptionAndContinueFlow() throws Exception {
        when(request.getMethod()).thenReturn("POST");
        UserData userData = getMockedUserData();

        when(userDataCollector.collect(any(ServletDataPayloadAdapter.class))).thenReturn(userData);
        doThrow(new RuntimeException("Error in RequestDataCollector"))
                .when(requestDataCollector).collect(any());

        filter.doFilter(request, response, chain);

        verify(chain).doFilter(any(ContentCachingRequestWrapper.class), any(ContentCachingResponseWrapper.class));
        verify(userDataCollector).collect(any(ServletDataPayloadAdapter.class));
    }
}