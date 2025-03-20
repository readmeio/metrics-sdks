package com.readme.core.dataextraction.payload.user;

import lombok.Getter;

@Getter
public enum UserDataSource {

    HEADER("header"),
    BODY("jsonBody"),
    JWT("jwt");

    private final String value;

    UserDataSource(String value) {
        this.value = value;
    }

}
