package com.readme.datatransfer;

import com.readme.domain.RequestMetadata;
import com.readme.exception.EmptyRequestBodyException;
import okhttp3.*;

import java.io.IOException;

public class HttpDataSender implements DataSender {

    private final OkHttpClient client;

    public HttpDataSender(OkHttpClient client) {
        this.client = client;
    }

    //TODO move the hardcoded part to the configuration
    //  Add token Base64 encoding
    @Override
    public int send(RequestMetadata requestMetadata) {

        if (requestMetadata != null && requestMetadata.getBody() != null && !requestMetadata.getBody().isBlank()) {
            var body = RequestBody.create(requestMetadata.getBody(), MediaType.get("application/json"));
            Request request = new Request.Builder()
                    .url("https://metrics.readme.io/v1/request")
                    .header("Accept", "application/json")
                    .header("Content-Type", "application/json")
                    .header("Authorization", "Basic cmRtZV94bjhzOWgzYzQwYzgxMjAzOThiZjRlZWQzNDhmZjBlODAyZGM4ZTA2ZjJlYzVkNDYyYmUwOTdlN2JlYjg1YzkzODA5ZWEwOg==")
                    .method("POST", body)
                    .build();

            try (Response response = client.newCall(request).execute()) {
                return response.code();
            } catch (IOException e) {
                throw new RuntimeException(e);
            }
        }

        throw new EmptyRequestBodyException();
    }


}
