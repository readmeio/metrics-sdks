package com.readme.starter.datacollection.userinfo;

import com.auth0.jwt.interfaces.DecodedJWT;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.readme.dataextraction.UserDataExtractor;
import com.readme.starter.datacollection.ServletDataPayloadAdapter;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import com.auth0.jwt.JWT;


import java.util.Map;


@AllArgsConstructor
@Component
@Slf4j
public class ServletUserDataExtractor implements UserDataExtractor<ServletDataPayloadAdapter> {

    private ObjectMapper objectMapper;

    //TODO: Consider possibility to extract the data from the header`s multiple value
    // Is there any practical sense?
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
        if (payload.getRequestContentType().equalsIgnoreCase("application/json")) {
            String requestBody = payload.getRequestBody();
            try {
                JsonNode currentNode = objectMapper.readTree(requestBody);
                if (!fieldPath.startsWith("/")) {
                    fieldPath = "/" + fieldPath;
                }
                return currentNode.at(fieldPath).asText();
            } catch (Exception e) {
                log.error("Error when reading the user data from JSON body: {}", e.getMessage());
            }
        }
        log.error("The provided body content type {} is not supported to get user data.", payload.getRequestContentType());
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
