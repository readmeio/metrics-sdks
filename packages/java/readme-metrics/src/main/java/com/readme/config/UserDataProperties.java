package com.readme.config;

import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class UserDataProperties {

    FieldMapping apiKey;
    FieldMapping email;
    FieldMapping label;

}
