package com.readme.core.datatransfer;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import lombok.extern.slf4j.Slf4j;
import java.util.concurrent.TimeUnit;
import java.util.function.Function;

import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.Response;
import org.json.JSONObject;

import static com.readme.core.config.ReadmeApiConfig.README_API_URL;
import static com.readme.core.datatransfer.ReadmeApiKeyEncoder.encode;

@Slf4j
public class BaseLogUrlFetcher {

    protected static final int CACHE_EXPIRATION_DAYS = 1;
    protected static final int REQUEST_TIMEOUT_SECONDS = 10;

    private static final Cache<String, String> baseUrlCache;
    private static final OkHttpClient httpClient;

    static {
        baseUrlCache = Caffeine.newBuilder()
                .expireAfterWrite(CACHE_EXPIRATION_DAYS, TimeUnit.DAYS)
                .maximumSize(512)
                .build();

        httpClient = new OkHttpClient.Builder()
                .callTimeout(REQUEST_TIMEOUT_SECONDS, TimeUnit.SECONDS)
                .build();
    }

    public static String fetchBaseLogUrl(String readmeApiKey) {
        return fetchBaseLogUrl(readmeApiKey, README_API_URL);
    }

    public static String fetchBaseLogUrl(String readmeApiKey, String apiUrl) {
        Function<String, String> fetcher = key -> baseUrlCache.get(key, readmeApiKey1
                -> fetchBaseUrlFromApi(readmeApiKey1, apiUrl));
        return fetcher.apply(readmeApiKey);
    }

    private static String fetchBaseUrlFromApi(String readmeApiKey, String apiUrl) {
        String encodedApiKey = encode(readmeApiKey);

        Request request = new Request.Builder()
                .url(apiUrl + "/v1")
                .header("Authorization", encodedApiKey)
                .build();

        try (Response response = httpClient.newCall(request).execute()) {
            if (!response.isSuccessful()) {
                log.error("Failed to fetch baseUrl: {} ", response.code() + " - " + response.message());
                return "";
            }

            String responseBody = response.body() != null ? response.body().string() : "";
            JSONObject jsonResponse = new JSONObject(responseBody);
            return jsonResponse.optString("baseUrl", "");
        } catch (Exception e) {
            log.error("Error while fetching baseUrl: {}", e.getMessage());
            return "";
        }
    }

}