package com.readme.core.datatransfer;

import java.util.Base64;

public class ReadmeApiKeyEncoder {

    public static String encode(String readmeApiKey) {
        String preparedReadmeAPIKey = readmeApiKey + ":";
        String encodedReadmeAPIKey = Base64.getEncoder().encodeToString(preparedReadmeAPIKey.getBytes());
        return "Basic " + encodedReadmeAPIKey;
    }

}
