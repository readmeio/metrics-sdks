package com.readme.domain;

import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class UserData {

    String apiKey;
    String email;
    String label;

}
