package com.readme.spring.datacollection.userinfo;

import com.auth0.jwt.interfaces.DecodedJWT;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.readme.spring.datacollection.ServletDataPayloadAdapter;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpMethod;
import org.springframework.stereotype.Component;
import com.auth0.jwt.JWT;


import java.util.Map;


@AllArgsConstructor
@Component
@Slf4j
public class ServletUserDataExtractor implements UserDataExtractor<ServletDataPayloadAdapter> {

    private ObjectMapper objectMapper;

    @Override
    public String extractFromHeader(ServletDataPayloadAdapter payload, String fieldName) {
        Map<String, String> requestHeaders = payload.getRequestHeaders();
        if (requestHeaders.containsKey(fieldName)) {
            return requestHeaders.get(fieldName);
        }
        log.error("The provided header name {} does not exist.", fieldName);
        return "";
    }

    @Override
    public String extractFromBody(ServletDataPayloadAdapter payload, String fieldPath) {
        if (payload.getRequestMethod().equalsIgnoreCase(HttpMethod.GET.name())) {
            log.error("The HTTP method {} is not supported to get user data from body.", payload.getRequestMethod());
            return "";
        }

        if (!payload.getRequestContentType().equalsIgnoreCase("application/json")) {
            log.error("The provided body content type {} is not supported to get user data.", payload.getRequestContentType());
            return "";
        }

        try {
            String requestBody = payload.getRequestBody();
            JsonNode currentNode = objectMapper.readTree(requestBody);
            if (!fieldPath.startsWith("/")) {
                fieldPath = "/" + fieldPath;
            }
            return currentNode.at(fieldPath).asText();
        } catch (Exception e) {
            log.error("Error when reading the user data from JSON body: {}", e.getMessage());
        }
        return "";
    }

    @Override
    public String extractFromJwt(ServletDataPayloadAdapter payload, String fieldName) {
        try {
            Map<String, String> requestHeaders = payload.getRequestHeaders();
            String jwtToken = requestHeaders.get("authorization");

            if (jwtToken == null) {
                log.error("The JWT token is not provided as Authorization header.");
                return "";
            }
            if (jwtToken.startsWith("Bearer ")) {
                jwtToken = jwtToken.substring(7);
            }

            DecodedJWT decodedJWT = JWT.decode(jwtToken);
            return decodedJWT.getClaim(fieldName).asString();
        } catch (Exception e) {
            log.error("The Authorization token is invalid. {}", e.getMessage());
        }
        return "";
    }

}
