package com.readme.spring.datacollection.userinfo;


import com.readme.core.dataextraction.payload.user.UserData;
import com.readme.core.dataextraction.payload.user.UserDataCollector;
import com.readme.core.dataextraction.payload.user.UserDataSource;
import com.readme.spring.config.UserDataProperties;
import com.readme.spring.datacollection.ServletDataPayloadAdapter;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;


/**
 * Responsible for selecting the appropriate {@link UserDataExtractor}
 * based on the provided configuration in the application settings.
 * <p>
 * This class acts as a bridge between YAML/Properties configuration and
 * the corresponding strategy for extracting user-related data
 * (e.g., from JSON body, headers, or JWT tokens).
 * <p>
 * Ensures flexibility and proper encapsulation of the strategy selection logic.
 */

@AllArgsConstructor
@Slf4j
public class ServletUserDataCollector implements UserDataCollector<ServletDataPayloadAdapter> {

    private UserDataProperties userDataProperties;

    private final UserDataExtractor<ServletDataPayloadAdapter> extractionService;

    @Override
    public UserData collect(ServletDataPayloadAdapter payload) {

        String apiKey = getApiKey(payload);
        String email = getEmail(payload);
        String label = getLabel(payload);

        return UserData.builder()
                .apiKey(apiKey)
                .email(email)
                .label(label)
                .build();

    }

    private String getApiKey(ServletDataPayloadAdapter payload) {
        FieldMapping apiKey = userDataProperties.getApiKey();
        if (apiKey == null) {
            log.error("api-key extraction is not configured properly");
            return "";
        }
        return extractFieldValue(payload, apiKey);
    }

    private String getEmail(ServletDataPayloadAdapter payload) {
        FieldMapping apiKey = userDataProperties.getEmail();
        if (apiKey == null) {
            log.error("email extraction is not configured properly");
            return "";
        }
        return extractFieldValue(payload, apiKey);
    }

    private String getLabel(ServletDataPayloadAdapter payload) {
        FieldMapping apiKey = userDataProperties.getLabel();
        if (apiKey == null) {
            log.error("label extraction is not configured properly");
            return "";
        }
        return extractFieldValue(payload, apiKey);
    }

    private String extractFieldValue(ServletDataPayloadAdapter payload, FieldMapping fieldMapping) {
        if (fieldMapping.getSource().equals(UserDataSource.HEADER.getValue())) {
            String fieldName = fieldMapping.getFieldName().toLowerCase();
            String fieldValue = extractionService.extractFromHeader(payload, fieldName);

            validate(fieldValue);
            return fieldValue;
        }

        if (fieldMapping.getSource().equals(UserDataSource.BODY.getValue())) {
            String fieldName = fieldMapping.getFieldName().toLowerCase();
            String fieldValue = extractionService.extractFromBody(payload, fieldName);

            validate(fieldValue);
            return fieldValue;
        }

        if (fieldMapping.getSource().equals(UserDataSource.JWT.getValue())) {
            String fieldName = fieldMapping.getFieldName().toLowerCase();
            String fieldValue = extractionService.extractFromJwt(payload, fieldName);

            validate(fieldValue);
            return fieldValue;
        }

        log.error("unknown field source: {}", fieldMapping.getSource());

        //TODO handle this
        return "";
    }

    private void validate(String fieldValue) {
        if (fieldValue == null || fieldValue.isEmpty()) {
            log.error("The {} extraction is not configured properly. The value is empty", fieldValue);
        }
    }

}


