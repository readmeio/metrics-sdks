package com.readme.domain;

import lombok.Builder;
import lombok.Value;

import java.util.Map;

@Value
@Builder
public class RequestMetadata {

    String encodedToken;
    Map<String, String> headers;
    String body;

}
