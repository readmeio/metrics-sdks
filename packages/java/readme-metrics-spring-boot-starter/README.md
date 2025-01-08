## Table of Contents
1. [Overview](#overview)
2. [Configuration](#configuration)
   - [Readme API Key](#readme-api-key)
   - [User data configuration ](#userdata-configuration)
   - [Custom user data collection config](#customizing-user-data-collection)

---

## Overview

This library provides an easy way to integrate the ReadMe Metrics into a Spring Boot application, 
enabling comprehensive monitoring and logging capabilities. 
The SDK is designed to collect detailed information from HTTP requests and responses, as well as user-specific data, 
for better observability and insights into application behavior.

### Key Features:
1. **Request and Response Data Logging**:
  - Collects HTTP request and response details, including headers, body content, and HTTP status codes.
  - Ensures minimal impact on the application's core business logic by leveraging efficient wrappers for request and response processing.

2. **User Data Extraction**:
  - Logs information about the user making the request, such as `api-key`, `email`, and `label`.
  - Supports multiple configurable data extraction methods:
    - **HTTP headers**
    - **JWT claims**
    - **JSON body fields**

---

## Configuration

To configure the library, you need to define two main aspects:
1. The `ReadMe API Key`, which is required to send logged data to the ReadMe platform.
2. The `UserData` fields (`apiKey`, `email`, `label`), which define where to extract user-specific information from incoming requests.

### ReadMe API Key configuration

The `ReadMe API Key` is a unique identifier that you receive from the ReadMe platform. It is used to authenticate and authorize data sent to the ReadMe metrics endpoint.
You can configure the `ReadMe API Key` in your `application.yaml` or `application.properties` file using environment variables for security.

**application.yaml:**
```yaml
readme:
  readmeApiKey: ${README_API_KEY}
```
**application.properties:**
```properties
readme.readmeApiKey=${README_API_KEY}
```

### UserData configuration

The library allows you to extract user-specific data (`apiKey`, `email`, `label`) from incoming HTTP requests. Each field requires two properties:
- **`source`**: Specifies where to extract the data from.
  - Possible values:
    - `header`: Extracts data from an HTTP header.
    - `jwtClaim`: Extracts data from a JWT token claim.
    - `jsonBody`: Extracts data from the JSON body of a request.
- **`fieldName`**: The key or field name corresponding to the specified source.


**application.yaml:**
```yaml
readme:
  userdata:
    apiKey:
      source: header
      fieldName: X-User-Id
    email:
      source: jwtClaim
      fieldName: aud
    label:
      source: jsonBody
      fieldName: user/name
```

**application.properties:**
```properties
readme.userdata.apikey.source=header
readme.userdata.apikey.fieldname=X-User-Id

readme.userdata.email.source=jwt
readme.userdata.email.fieldname=aud

readme.userdata.label.source=jsonBody
readme.userdata.label.fieldname=user/name
```

### Customizing user data collection

The library provides a default implementation of `UserDataCollector`, which extracts user data based on the configuration 
in your YAML or properties file. However, some use cases may require custom logic to extract user-specific information. 
For example:
- The user data comes from a unique header format.
- Complex logic is needed to determine user-specific fields.
- Multiple fields need to be combined dynamically.

In such cases, you can configure the library with a custom way of extracting user data information 
by creating your own implementation of `UserDataCollector`.

---

#### How to Create a Custom UserDataCollector

To create a custom `UserDataCollector`, define a Spring bean for your implementation. 
The library's configuration will automatically use your custom implementation if it is present in the application context.

---

#### Example: Custom Implementation

Below is an example of a custom `UserDataCollector` that extracts the `apiKey` from an HTTP header and assigns static 
values for `email` and `label`.

```java
@Configuration
public class CustomUserDataCollectorConfig {

    @Bean
    public UserDataCollector<ServletDataPayloadAdapter> customUserDataCollector() {
        return payloadAdapter -> {
            // Extract the apiKey from the request headers
            String apiKey = payloadAdapter.getRequestHeaders().get("x-user-name");

            // Build the UserData object
            return UserData.builder()
                    .apiKey(apiKey)
                    .email("owl@birdfact0ry.abc")
                    .label("owl-label")
                    .build();
        };
    }
}