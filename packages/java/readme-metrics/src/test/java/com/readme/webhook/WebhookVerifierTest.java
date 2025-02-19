package com.readme.webhook;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

class WebhookVerifierTest {

    private static final String SECRET = "my-secret-key";
    private static final String VALID_BODY = "{\"email\":\"test@example.com\"}";
    private static final long VALID_TIMESTAMP = Instant.now().toEpochMilli();

    @Test
    void testVerifyWebhook_HappyPath() {
        String signature = generateSignature(VALID_BODY, VALID_TIMESTAMP, SECRET);
        Map<String, Object> result = WebhookVerifier.verifyWebhook(VALID_BODY, signature, SECRET);

        assertNotNull(result);
        assertEquals("{\"email\":\"test@example.com\"}", result.get("email"));
    }

    @Test
    void testVerifyWebhook_MissingSignature() {
        Exception exception = assertThrows(IllegalArgumentException.class, () ->
                WebhookVerifier.verifyWebhook(VALID_BODY, null, SECRET)
        );
        assertEquals("Missing Signature", exception.getMessage());
    }

    @Test
    void testVerifyWebhook_InvalidSignatureFormat() {
        String invalidSignature = "t=invalid,v1=invalid";
        Exception exception = assertThrows(IllegalArgumentException.class, () ->
                WebhookVerifier.verifyWebhook(VALID_BODY, invalidSignature, SECRET)
        );
        assertEquals("Invalid Signature Format", exception.getMessage());
    }

    @Test
    void testVerifyWebhook_ExpiredSignature() {
        long expiredTimestamp = VALID_TIMESTAMP - (WebhookVerifier.SIGNATURE_EXPIRATION_TIME + 1000);
        String signature = generateSignature(VALID_BODY, expiredTimestamp, SECRET);
        Exception exception = assertThrows(IllegalArgumentException.class, () ->
                WebhookVerifier.verifyWebhook(VALID_BODY, signature, SECRET)
        );
        assertEquals("Expired Signature", exception.getMessage());
    }

    @Test
    void testVerifyWebhook_InvalidSignature() {
        String invalidSignature = "t=" + VALID_TIMESTAMP + ",v0=invalid-signature";
        Exception exception = assertThrows(IllegalArgumentException.class, () ->
                WebhookVerifier.verifyWebhook(VALID_BODY, invalidSignature, SECRET)
        );
        assertEquals("Invalid Signature", exception.getMessage());
    }

    private String generateSignature(String body, long timestamp, String secret) {
        String unsigned = timestamp + "." + body;
        String computedSignature = WebhookVerifier.computeHmacSHA256(unsigned, secret);
        return "t=" + timestamp + ",v0=" + computedSignature;
    }
}
