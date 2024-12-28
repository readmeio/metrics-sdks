package com.readme.datatransfer;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.readme.config.CoreConfig;
import lombok.extern.slf4j.Slf4j;
import okhttp3.*;

import java.io.IOException;
import java.util.Base64;
import java.util.List;

/**
 * Implementation of the {@link DataSender} interface that sends metrics data to a remote server
 * over HTTP using the OkHttp library. It is responsible for creating and executing HTTP POST requests
 * to the specified metrics endpoint. It prepares the request payload, adds necessary headers (e.g.,
 * authentication and content type), and handles the response from the server.
 *
 * <p>The default endpoint for sending metrics is {@code https://metrics.readme.io/v1/request}.
 *
 */

@Slf4j
public class HttpDataSender implements DataSender {

    public static final String APPLICATION_JSON_TYPE = "application/json";

    private final OkHttpClient client;
    private final CoreConfig coreConfig;

    public HttpDataSender(OkHttpClient client, CoreConfig coreConfig) {
        this.client = client;
        this.coreConfig = coreConfig;
    }

    @Override
    public int send(List<OutgoingLogBody> payloadData) {
        if (payloadData != null) {
            String encodedReadmeApiKey = getEncodedReadmeApiKey();
            Response response = null;
            try {
                Request request = createRequest(payloadData, encodedReadmeApiKey);
                response = client.newCall(request).execute();
                return response.code();
            } catch (JsonProcessingException e) {
                log.error("Error while building outgoing payload: ", e);
            } catch (IOException e) {
                log.error("Error while sending collected data: ", e);
            } finally {
                if (response != null) {
                    response.close();
                }
            }
        }
        return 0;
    }

    private static Request createRequest(List<OutgoingLogBody> payloadData, String encodedReadmeApiKey) throws JsonProcessingException {
        ObjectMapper objectMapper = new ObjectMapper();
        String outgoingLogBody = objectMapper.writeValueAsString(payloadData);
        RequestBody body = RequestBody
                .create(outgoingLogBody, MediaType.get(APPLICATION_JSON_TYPE));

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
