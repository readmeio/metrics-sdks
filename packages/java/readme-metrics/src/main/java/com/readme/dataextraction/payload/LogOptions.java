package com.readme.dataextraction.payload;

import lombok.Data;

import java.util.List;

@Data
public class LogOptions {

    private List<String> allowlist;
    private List<String> denylist;
    private Boolean development;
    private Boolean fireAndForget;
    private Object logger;

}