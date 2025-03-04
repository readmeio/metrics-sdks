## Table of Contents

1. [Overview](#overview)
2. [Readme configuration](#readme-configuration)
3. [User Data Configuration](#user-data-configuration)
   - [Custom User Data Collector](#custom-user-data-collector)
   - [YAML and Properties-based Configuration](#yaml-and-properties-based-configuration)
4. [Logging Configuration](#logging-configuration)
5. [Webhook Verification](#webhook-verification)

---

## Overview

This documentation provides a clear and structured guide for integrating ReadMe Metrics SDK into your Spring Boot application. 🚀
The SDK is designed to collect detailed information from HTTP requests and responses, as well as user-specific data,
for better observability and insights into application behavior.

### Key Features:

**Request and Response Data Logging**:

- Collects HTTP request and response details, including headers, body content, and HTTP status codes.
- Ensures minimal impact on the application's core business logic by leveraging efficient wrappers for request and response processing.

**User Data Extraction**:

- Logs information about the user making the request, such as `api-key`, `email`, and `label`.
- Supports multiple configurable data extraction methods:
  - **HTTP headers**
  - **JWT claims**
  - **JSON body fields**

---

## Readme configuration

Metrics-spring expects you to add `readme.readmeApiKey` property to your application `yaml` or `properties` configuration.

```yaml
readme:
  readmeApiKey: ${README_API_KEY}
```

---

## User Data Configuration

The library provides multiple ways to configure user data extraction. The recommended approach is to define a custom implementation of `UserDataCollector`.
However, you can also use YAML or properties-based configuration.

### Custom User Data Collector

The preferred method for configuring user data extraction is by defining a custom implementation of `UserDataCollector`.
This allows for greater flexibility and customization of how user-specific data is collected.

#### Example: Custom Implementation

```java
@Configuration
public class CustomUserDataCollectorConfig {

    @Bean
    public UserDataCollector<ServletDataPayloadAdapter> customUserDataCollector() {
        return payloadAdapter -> {
            String apiKey = payloadAdapter.getRequestHeaders().get("x-user-name");

            return UserData.builder()
                    .apiKey(apiKey)
                    .email("owl@birdfact0ry.abc")
                    .label("owl-label")
                    .build();
        };
    }
}
```

This approach gives you full control over how user data is extracted from requests. Use `payloadAdapter` to get access
to different parts of an HTTP request (headers, body etc.)

---

### YAML and Properties-based Configuration

As an alternative to implementing `UserDataCollector`, you can configure user data extraction through your application configuration files.
Using this approach, the library will try to get user data automatically based on provided properties.

Each field (`apiKey`, `email`, `label`) requires two properties:

- **`source`**: Specifies where to extract the data from.
  - Possible values:
    - `header`: Extracts data from an HTTP header.
    - `jwtClaim`: Extracts data from a JWT token claim.
    - `jsonBody`: Extracts data from the JSON body of a request.
- **`fieldName`**: The key or field name corresponding to the specified source.

#### Example YAML Configuration

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

#### Example Properties Configuration

```properties
readme.userdata.apikey.source=header
readme.userdata.apikey.fieldname=X-User-Id

readme.userdata.email.source=jwt
readme.userdata.email.fieldname=aud

readme.userdata.label.source=jsonBody
readme.userdata.label.fieldname=user/name
```

While YAML and properties-based configuration offer a minimal setup, **using a custom implementation provides more flexibility and customization**.

---

## Logging Configuration

By default, logging for the `com.readme` package is **inactive** to prevent unnecessary log clutter.

If you want to enable logging for this library, you can set the logging level in your `application.properties` or `application.yaml` file:

**application.properties:**

```properties
logging.level.com.readme=DEBUG
```

**application.yaml:**

```yaml
logging:
  level:
    com.readme: DEBUG
```

You can replace `DEBUG` with any other log level (`INFO`, `WARN`, `ERROR`, etc.) according to your needs.

---

## Webhook Verification

The library includes a `WebhookVerifier` utility to help verify webhooks received from ReadMe.
This ensures that webhook payloads are legitimate and have not been tampered with.

### How to Use WebhookVerifier

To verify incoming webhooks, use the `WebhookVerifier` utility within a Spring Boot controller.

#### Example Implementation

```java
@RestController
@RequestMapping("/webhook")
public class WebhookController {

    private static final String SECRET = "my_secret";

    @PostMapping(consumes = "application/json", produces = "application/json")
    public ResponseEntity<WebhookResponse> handleWebhook(@RequestBody String requestBody,
                                                         @RequestHeader("readme-signature") String signature) {
        WebhookVerifier.verifyWebhook(requestBody, signature, SECRET);
        return ResponseEntity.ok(new WebhookResponse("Owl Bowl"));
    }

    @Data
    @AllArgsConstructor
    public static class WebhookResponse {
        private String user;
    }
}
```
