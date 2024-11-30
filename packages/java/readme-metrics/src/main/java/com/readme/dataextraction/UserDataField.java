package com.readme.dataextraction;

import lombok.Getter;

@Getter
public enum UserDataField {

    API_KEY("api-key"),
    EMAIL("email"),
    LABEL("label");

    private final String fieldName;

    UserDataField(String fieldName) {
        this.fieldName = fieldName;
    }

}
