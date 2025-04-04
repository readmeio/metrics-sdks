package com.readme.core.datatransfer;

import com.readme.core.datatransfer.ReadmeApiKeyEncoder;
import org.junit.jupiter.api.Test;

import java.util.Base64;

import static org.junit.jupiter.api.Assertions.assertEquals;

class ReadmeApiKeyEncoderTest {

    @Test
    void encode_ShouldReturnBase64EncodedApiKey_WithBasicPrefix() {
        String apiKey = "my-test-api-key";
        String expectedEncodedApiKey = "Basic " + Base64.getEncoder().encodeToString((apiKey + ":").getBytes());
        String result = ReadmeApiKeyEncoder.encode(apiKey);

        assertEquals(expectedEncodedApiKey, result);
    }

    @Test
    void encode_ShouldHandleEmptyApiKey() {
        String apiKey = "";
        String expectedEncodedApiKey = "Basic " + Base64.getEncoder().encodeToString(":".getBytes());
        String result = ReadmeApiKeyEncoder.encode(apiKey);

        assertEquals(expectedEncodedApiKey, result);
    }

    @Test
    void encode_ShouldReturnCorrectEncodedValue_ForSpecialCharactersInApiKey() {
        String apiKey = "api-key!@#$%^&*()";
        String expectedEncodedApiKey = "Basic " + Base64.getEncoder().encodeToString((apiKey + ":").getBytes());
        String result = ReadmeApiKeyEncoder.encode(apiKey);

        assertEquals(expectedEncodedApiKey, result);
    }
}