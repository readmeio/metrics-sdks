package com.readme.core.dataextraction;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Base64;

public class ApiKeyMasker {

    public static String mask(String apiKey) {
        try {
            String base64Hash = Base64.getEncoder()
                    .encodeToString(MessageDigest
                            .getInstance("SHA-512")
                            .digest(apiKey.getBytes(StandardCharsets.UTF_8)));

            String last4Digits = apiKey.substring(apiKey.length() - 4);
            return "sha512-" + base64Hash + "?" + last4Digits;
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-512 algorithm not available", e);
        } catch (StringIndexOutOfBoundsException e) {
            throw new IllegalArgumentException("API key must be at least 4 characters long", e);
        }
    }

}