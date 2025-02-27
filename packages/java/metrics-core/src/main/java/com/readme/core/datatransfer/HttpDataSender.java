package com.readme.core.datatransfer;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.readme.core.config.CoreConfig;
import com.readme.core.dataextraction.LogOptions;
import lombok.extern.slf4j.Slf4j;
import okhttp3.*;

import java.io.IOException;
import java.util.List;

import static com.readme.core.config.ReadmeApiConfig.README_METRICS_URL;
import static com.readme.core.datatransfer.BaseLogUrlFetcher.fetchBaseLogUrl;
import static com.readme.core.datatransfer.ReadmeApiKeyEncoder.encode;

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
    public boolean send(List<OutgoingLogBody> payloadData, LogOptions logOptions) {
        if (payloadData != null) {
            String encodedReadmeApiKey = encode(coreConfig.getReadmeAPIKey());
            Response response = null;
            try {
                Request request = createRequest(payloadData, logOptions, encodedReadmeApiKey);
                if(logOptions.isFireAndForget()){
                    makeAsyncRequest(request);
                    return true;
                }
                response = client.newCall(request).execute();
                return response.isSuccessful();
            } catch (JsonProcessingException e) {
                log.error("Error while building outgoing payload: ", e);
            } catch (Exception e) {
                log.error("Error while sending collected data: ", e);
            } finally {
                if (response != null) {
                    response.close();
                }
            }
        }
        return false;
    }

    private void makeAsyncRequest(Request request) {

        client.newCall(request).enqueue(new Callback() {
            @Override
            public void onFailure(Call call, IOException e) {
                log.error("Error while sending outgoing payload: ", e);
            }

            @Override
            public void onResponse(Call call, Response response) throws IOException {
                response.close();
            }
        });
    }

    private static Request createRequest(List<OutgoingLogBody> payloadData, LogOptions logOptions, String encodedReadmeApiKey) throws JsonProcessingException {
        ObjectMapper objectMapper = new ObjectMapper();
        String outgoingLogBody = objectMapper.writeValueAsString(payloadData);
        RequestBody body = RequestBody
                .create(outgoingLogBody, MediaType.get(APPLICATION_JSON_TYPE));

        String baseLogUrl = logOptions.getBaseLogUrl() != null ? logOptions.getBaseLogUrl() : fetchBaseLogUrl(encodedReadmeApiKey);


        return new Request.Builder()
                .url(README_METRICS_URL)
                .header("Accept", APPLICATION_JSON_TYPE)
                .header("Content-Type", APPLICATION_JSON_TYPE)
                .header("Authorization", encodedReadmeApiKey)
                .header("x-documentation-url", baseLogUrl)
                .method("POST", body)
                .build();
    }



}
