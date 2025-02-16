package com.readme.spring.datacollection.userinfo;

import com.readme.dataextraction.payload.user.UserData;
import com.readme.dataextraction.payload.user.UserDataSource;
import com.readme.spring.config.UserDataProperties;
import com.readme.spring.datacollection.ServletDataPayloadAdapter;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

class ServletUserDataCollectorTest {

    private ServletUserDataCollector userDataCollector;

    @Mock
    private UserDataProperties userDataProperties;

    @Mock
    private UserDataExtractor<ServletDataPayloadAdapter> extractionService;

    @Mock
    private ServletDataPayloadAdapter payload;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        userDataCollector = new ServletUserDataCollector(userDataProperties, extractionService);
    }

    @Test
    void collect_HappyCase() {
        FieldMapping apiKeyMapping = new FieldMapping(UserDataSource.HEADER.getValue(), "x-api-key");
        FieldMapping emailMapping = new FieldMapping(UserDataSource.BODY.getValue(), "email");
        FieldMapping labelMapping = new FieldMapping(UserDataSource.JWT.getValue(), "label");

        when(userDataProperties.getApiKey()).thenReturn(apiKeyMapping);
        when(userDataProperties.getEmail()).thenReturn(emailMapping);
        when(userDataProperties.getLabel()).thenReturn(labelMapping);

        when(extractionService.extractFromHeader(payload, "x-api-key")).thenReturn("test-api-key");
        when(extractionService.extractFromBody(payload, "email")).thenReturn("test@example.com");
        when(extractionService.extractFromJwt(payload, "label")).thenReturn("user-label");

        UserData result = userDataCollector.collect(payload);

        assertThat(result).isNotNull();
        assertThat(result.getApiKey()).isEqualTo("test-api-key");
        assertThat(result.getEmail()).isEqualTo("test@example.com");
        assertThat(result.getLabel()).isEqualTo("user-label");
    }

    @Test
    void collect_MissingApiKeyConfiguration() {
        when(userDataProperties.getApiKey()).thenReturn(null);
        UserData result = userDataCollector.collect(payload);

        assertThat(result).isNotNull();
        assertThat(result.getApiKey()).isEmpty();
        verify(extractionService, never()).extractFromHeader(any(), anyString());
    }

    @Test
    void collect_EmptyHeaderValue() {
        FieldMapping apiKeyMapping = new FieldMapping(UserDataSource.HEADER.getValue(), "x-api-key");
        when(userDataProperties.getApiKey()).thenReturn(apiKeyMapping);
        when(extractionService.extractFromHeader(payload, "x-api-key")).thenReturn("");

        UserData result = userDataCollector.collect(payload);

        assertThat(result).isNotNull();
        assertThat(result.getApiKey()).isEmpty();
        verify(extractionService).extractFromHeader(payload, "x-api-key");
    }

    @Test
    void collect_UnknownFieldSource() {
        FieldMapping unknownMapping = new FieldMapping("UNKNOWN", "field");
        when(userDataProperties.getApiKey()).thenReturn(unknownMapping);

        UserData result = userDataCollector.collect(payload);

        assertThat(result).isNotNull();
        assertThat(result.getApiKey()).isEmpty();
    }

    @Test
    void collect_NullPayload() {
        UserData result = userDataCollector.collect(null);

        assertThat(result).isNotNull();
        assertThat(result.getApiKey()).isEmpty();
        assertThat(result.getEmail()).isEmpty();
        assertThat(result.getLabel()).isEmpty();
    }
}