package com.readme.dataextraction.user;

import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class UserData {

    String apiKey;
    String email;
    String label;

}
