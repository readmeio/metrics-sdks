package com.readme.dataextraction;

import lombok.Getter;

@Getter
public enum UserDataSource {

    HEADER("header"),
    BODY("jsonBody"),
    JWT("jwtClaim");

    private final String source;

    UserDataSource(String source) {
        this.source = source;
    }

}
