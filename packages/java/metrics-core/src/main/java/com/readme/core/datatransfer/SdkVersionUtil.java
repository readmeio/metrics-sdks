package com.readme.core.datatransfer;

import lombok.extern.slf4j.Slf4j;

import java.io.IOException;
import java.io.InputStream;
import java.util.Properties;

public class SdkVersionUtil {
    public static String getVersion() {
        try (InputStream is = SdkVersionUtil.class.getClassLoader()
                .getResourceAsStream("version.properties")) {
            Properties properties = new Properties();
            properties.load(is);
            return properties.getProperty("version");
        } catch (IOException e) {
            return "UNKNOWN";
        }
    }
}