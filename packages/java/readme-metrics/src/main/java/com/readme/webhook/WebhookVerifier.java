package com.readme.webhook;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

public class WebhookVerifier {

    public static final long SIGNATURE_EXPIRATION_TIME = 30 * 60 * 1000;
    public static final String SIGNATURE_SCHEME = "v0";
    public static final String SECRET_KEY_ALGORITHM = "HmacSHA256";

    public static Map<String, Object> verifyWebhook(String body, String signature, String secret) {
        if (signature == null || signature.isEmpty()) {
            throw new IllegalArgumentException("Missing Signature");
        }

        Map<String, String> parsedSignature = parseSignature(signature);
        String signatureTime = parsedSignature.get("t");
        String readmeSignature = parsedSignature.get(SIGNATURE_SCHEME);

        if (signatureTime == null || readmeSignature == null) {
            throw new IllegalArgumentException("Invalid Signature Format");
        }

        long timestamp = Long.parseLong(signatureTime);
        long now = Instant.now().toEpochMilli();
        if (Math.abs(now - timestamp) > SIGNATURE_EXPIRATION_TIME) {
            throw new IllegalArgumentException("Expired Signature");
        }

        String unsigned = timestamp + "." + body;
        String computedSignature = computeHmacSHA256(unsigned, secret);

        if (!computedSignature.equals(readmeSignature)) {
            throw new IllegalArgumentException("Invalid Signature");
        }

        Map<String, Object> result = new HashMap<>();
        result.put("email", body);
        return result;
    }

    private static Map<String, String> parseSignature(String signature) {
        Map<String, String> parsed = new HashMap<>();
        String[] parts = signature.split(",");
        for (String part : parts) {
            String[] kv = part.split("=");
            if (kv.length == 2) {
                parsed.put(kv[0].trim(), kv[1].trim());
            }
        }
        return parsed;
    }

    protected static String computeHmacSHA256(String data, String secret) {
        try {
            Mac hmac = Mac.getInstance(SECRET_KEY_ALGORITHM);
            SecretKeySpec secretKey = new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), SECRET_KEY_ALGORITHM);
            hmac.init(secretKey);
            byte[] hashBytes = hmac.doFinal(data.getBytes(StandardCharsets.UTF_8));
            return bytesToHex(hashBytes);
        } catch (Exception e) {
            throw new IllegalArgumentException("Invalid Signature");
        }
    }

    private static String bytesToHex(byte[] bytes) {
        StringBuilder hexString = new StringBuilder();
        for (byte b : bytes) {
            String hex = Integer.toHexString(0xff & b);
            if (hex.length() == 1) {
                hexString.append('0');
            }
            hexString.append(hex);
        }
        return hexString.toString();
    }
}