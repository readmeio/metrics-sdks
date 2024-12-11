package com.readme.dataextraction;

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
