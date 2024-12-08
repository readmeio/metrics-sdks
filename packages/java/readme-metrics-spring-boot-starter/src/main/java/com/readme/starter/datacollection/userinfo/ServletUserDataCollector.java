package com.readme.starter.datacollection.userinfo;

import com.readme.config.FieldMapping;
import com.readme.config.UserDataConfig;
import com.readme.dataextraction.UserDataCollector;
import com.readme.dataextraction.UserDataExtractor;
import com.readme.dataextraction.UserDataField;
import com.readme.dataextraction.UserDataSource;
import com.readme.domain.UserData;
import com.readme.starter.datacollection.HttpServletDataPayload;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Responsible for selecting the appropriate {@link UserDataExtractor}
 * based on the provided configuration in the application settings.
 *
 * This class acts as a bridge between YAML/Properties configuration and
 * the corresponding strategy for extracting user-related data
 * (e.g., from JSON body, headers, or JWT tokens).
 *
 * Ensures flexibility and proper encapsulation of the strategy selection logic.
 */

@AllArgsConstructor
@Slf4j
public class ServletUserDataCollector implements UserDataCollector<HttpServletDataPayload> {

    private UserDataConfig userDataConfig;

    private final UserDataExtractor<HttpServletDataPayload> extractionService;

    @Override
    public UserData collect(HttpServletDataPayload payload) {

        String apiKey = getApiKey(payload);
        String email = getEmail(payload);
        String label = getLabel(payload);

        return UserData.builder()
                .apiKey(apiKey)
                .email(email)
                .label(label)
                .build();

    }

    private String getApiKey(HttpServletDataPayload payload) {
        FieldMapping apiKey = userDataConfig.getApiKey();
        if (apiKey == null) {
            log.error("api-key extraction is not configured properly");
            return "";
        }
        return extractFieldValue(payload, apiKey);
    }

    private String getEmail(HttpServletDataPayload payload) {
        FieldMapping apiKey = userDataConfig.getEmail();
        if (apiKey == null) {
            log.error("email extraction is not configured properly");
            return "";
        }
        return extractFieldValue(payload, apiKey);
    }

    private String getLabel(HttpServletDataPayload payload) {
        FieldMapping apiKey = userDataConfig.getLabel();
        if (apiKey == null) {
            log.error("label extraction is not configured properly");
            return "";
        }
        return extractFieldValue(payload, apiKey);
    }

    private String extractFieldValue(HttpServletDataPayload payload, FieldMapping fieldMapping) {
        if (fieldMapping.getSource().equals(UserDataSource.HEADER.name())) {
            UserDataField fieldName = UserDataField.valueOf(fieldMapping.getFieldName());
            return extractionService.extractFromHeader(payload, fieldName);
        }

        if (fieldMapping.getSource().equals(UserDataSource.BODY.name())) {
            UserDataField fieldName = UserDataField.valueOf(fieldMapping.getFieldName());
            return extractionService.extractFromBody(payload, fieldName);
        }

        if (fieldMapping.getSource().equals(UserDataSource.JWT.name())) {
            UserDataField fieldName = UserDataField.valueOf(fieldMapping.getFieldName());
            return extractionService.extractFromJwt(payload, fieldName);
        }

        log.error("unknown field source: {}", fieldMapping.getSource());

        return "";
    }

}
