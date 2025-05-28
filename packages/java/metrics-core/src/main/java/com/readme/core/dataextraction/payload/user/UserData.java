package com.readme.core.dataextraction.payload.user;

import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class UserData {
    /**
     * API Key used to make the request. Note that this is different from the `readmeAPIKey`
     * and should be a value from your API that is unique to each of your users.
     */
    String apiKey;

    /**
     * Email of the user that is making the call
     */
    String email;

    /**
     * This is the user's display name in the API Metrics Dashboard.
     */
    String label;

}
