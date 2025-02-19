package com.readme.core.dataextraction;

import lombok.*;

import java.util.List;

@Value
@Builder
public class LogOptions {

    List<String> allowlist;
    List<String> denylist;
    boolean development;
    boolean fireAndForget;
    String baseLogUrl;
    @Builder.Default
    int bufferLength = 1;

}