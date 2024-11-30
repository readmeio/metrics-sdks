package com.readme.datatransfer;

import com.readme.config.CoreConfig;
import com.readme.domain.RequestPayload;
import com.readme.exception.EmptyRequestBodyException;
import okhttp3.*;

import java.io.IOException;
import java.util.Base64;

/**
 * Implementation of the {@link DataSender} interface that sends metrics data to a remote server
 * over HTTP using the OkHttp library. It is responsible for creating and executing HTTP POST requests
 * to the specified metrics endpoint. It prepares the request payload, adds necessary headers (e.g.,
 * authentication and content type), and handles the response from the server.
 *
 * <p>The default endpoint for sending metrics is {@code https://metrics.readme.io/v1/request}.
 *
 */
public class HttpDataSender implements DataSender {

    public static final String APPLICATION_JSON_TYPE = "application/json";

    private final OkHttpClient client;
    private final CoreConfig coreConfig;

    public HttpDataSender(OkHttpClient client, CoreConfig coreConfig) {
        this.client = client;
        this.coreConfig = coreConfig;
    }

    @Override
    public int send(RequestPayload requestPayload) {
        if (requestPayload != null && requestPayload.getBody() != null && !requestPayload.getBody().isEmpty()) {
            String encodedReadmeApiKey = getEncodedReadmeApiKey();
            Request request = createRequest(requestPayload, encodedReadmeApiKey);

            try (Response response = client.newCall(request).execute()) {
                return response.code();
            } catch (IOException e) {
                throw new RuntimeException(e);
            }
        }
        throw new EmptyRequestBodyException();
    }

    private static Request createRequest(RequestPayload requestPayload, String encodedReadmeApiKey) {
        RequestBody body = RequestBody.create(requestPayload.getBody(), MediaType.get(APPLICATION_JSON_TYPE));
        return new Request.Builder()
                .url(README_METRICS_URL)
                .header("Accept", APPLICATION_JSON_TYPE)
                .header("Content-Type", APPLICATION_JSON_TYPE)
                .header("Authorization", encodedReadmeApiKey)
                .method("POST", body)
                .build();
    }

    private String getEncodedReadmeApiKey() {
        String preparedReadmeAPIKey = coreConfig.getReadmeAPIKey() + ":";
        String encodedReadmeAPIKey = Base64.getEncoder().encodeToString(preparedReadmeAPIKey.getBytes());
        return "Basic " + encodedReadmeAPIKey;
    }

}
