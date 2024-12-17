# Monitoring Library Configuration Guide

## Overview

This spring-boot-starter provides possibility to integrate Readme Metrics SDK to a Spring Boot application easily.
It provides a convenient way to extract user-specific information (e.g., api-key, email, label) from 
incoming HTTP requests. It allows configuring multiple extraction methods, such as HTTP headers, JWT claims, or JSON body fields.

## Configuration

Add the following properties to your `application.yaml` or `application.properties` file. 
Each field (`apiKey`, `email`, `label`) requires two sub-properties:
- `source`: Defines where to extract the data from. 
  - Possible values:
      - `header`: Extracts data from an HTTP header.
      - `jwtClaim`: Extracts data from a JWT token claim.
      - `jsonBody`: Extracts data from the JSON body of a request.
- `fieldName`: Specifies the name or key associated with the source.

### Example Configuration (YAML)
```yaml
readme:
  readmeApiKey: ${readmeApiKey}
  userdata:
    apiKey:
      source: header
      fieldName: X-User-Id
    email:
      source: jwt
      fieldName: aud
    label:
      source: jsonBody
      fieldName: user.name
```

### Example Configuration (PROPERTIES)
```properties
readme.userdata.apikey.source=header
readme.userdata.apikey.fieldname=X-User-Id

readme.userdata.email.source=jwtClaim
readme.userdata.email.fieldname=aud

readme.userdata.label.source=jsonBody
readme.userdata.label.fieldname=user.name
```