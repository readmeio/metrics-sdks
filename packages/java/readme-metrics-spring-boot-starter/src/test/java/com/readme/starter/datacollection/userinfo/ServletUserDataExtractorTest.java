package com.readme.starter.datacollection.userinfo;

import com.auth0.jwt.JWT;
import com.auth0.jwt.algorithms.Algorithm;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.readme.starter.datacollection.ServletDataPayloadAdapter;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpMethod;

import java.io.IOException;
import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.NoSuchAlgorithmException;
import java.security.interfaces.RSAPrivateKey;
import java.security.interfaces.RSAPublicKey;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ServletUserDataExtractorTest {

    private ServletUserDataExtractor extractor;

    @Mock
    private ServletDataPayloadAdapter payload;


    @BeforeEach
    void setUp() {
        extractor = new ServletUserDataExtractor(new ObjectMapper());
    }

    @Test
    void extractFromHeader_happyPath() {
        String headerName = "X-User-Name";
        String expectedValue = "Parrot";
        Map<String, String> headers = Map.of(headerName, expectedValue);
        Mockito.when(payload.getRequestHeaders()).thenReturn(headers);
        String result = extractor.extractFromHeader(payload, headerName);

        assertEquals(expectedValue, result);
    }

    @Test
    void extractFromHeader_headerNotFound() {
        String headerName = "X-User-Name";
        String expectedValue = "";
        Map<String, String> headers = Map.of();
        Mockito.when(payload.getRequestHeaders()).thenReturn(headers);
        String result = extractor.extractFromHeader(payload, headerName);

        assertEquals(expectedValue, result);
    }

    @Test
    void extractFromHeader_multipleValuesExtractedCorrectly() {
        String headerName = "X-User-Name";
        String expectedValue = "Parrot,Owl,Chicken";
        Map<String, String> headers = Map.of(headerName, expectedValue);
        Mockito.when(payload.getRequestHeaders()).thenReturn(headers);
        String result = extractor.extractFromHeader(payload, headerName);

        assertEquals(expectedValue, result);
    }

    @Test
    void extractFromJwt_happyPath_withBearerPrefix() throws NoSuchAlgorithmException {
        String claimName = "user_name";
        String expectedValue = "Parrot";

        Algorithm signingKeyPair = createSigningKeyPair();
        String jwt = JWT.create()
                .withClaim(claimName, expectedValue)
                .sign(signingKeyPair);
        Map<String, String> headers = Map.of("authorization", "Bearer " + jwt);
        Mockito.when(payload.getRequestHeaders()).thenReturn(headers);
        String result = extractor.extractFromJwt(payload, claimName);

        assertEquals(expectedValue, result);
    }

    @Test
    void extractFromJwt_happyPath_NoBearerPrefix() throws NoSuchAlgorithmException {
        String claimName = "user_name";
        String expectedValue = "Parrot";

        Algorithm signingKeyPair = createSigningKeyPair();
        String jwt = JWT.create()
                .withClaim(claimName, expectedValue)
                .sign(signingKeyPair);
        Map<String, String> headers = Map.of("authorization", jwt);
        Mockito.when(payload.getRequestHeaders()).thenReturn(headers);
        String result = extractor.extractFromJwt(payload, claimName);

        assertEquals(expectedValue, result);
    }

    @Test
    void extractFromJwt_missingAuthorizationHeader() {
        String claimName = "user_name";
        String expectedValue = "";

        Map<String, String> headers = Map.of();
        Mockito.when(payload.getRequestHeaders()).thenReturn(headers);
        String result = extractor.extractFromJwt(payload, claimName);

        assertEquals(expectedValue, result);
    }

    @Test
    void extractFromJwt_invalidJwtToken() {
        String claimName = "user_name";
        String expectedValue = "";

        Map<String, String> headers = Map.of("authorization", "Bearer invalidToken");
        Mockito.when(payload.getRequestHeaders()).thenReturn(headers);
        String result = extractor.extractFromJwt(payload, claimName);

        assertEquals(expectedValue, result);
    }

    @Test
    void extractFromBody_happyPath() throws IOException {
        String fieldName = "userName";
        String expectedValue = "Owl";

        String body = "{\"" + fieldName + "\":\"" + expectedValue + "\",\"anotherField\":\"anotherValue\"}";
        Mockito.when(payload.getRequestBody()).thenReturn(body);
        Mockito.when(payload.getRequestMethod()).thenReturn("POST");
        Mockito.when(payload.getRequestContentType()).thenReturn("application/json");
        String result = extractor.extractFromBody(payload, fieldName);

        assertEquals(expectedValue, result);
    }

    @Test
    void extractFromBody_fieldNotFound() {
        String fieldName = "userName";
        String expectedValue = "";

        String body = "{\"anotherField\":\"anotherValue\"}";
        Mockito.when(payload.getRequestBody()).thenReturn(body);
        Mockito.when(payload.getRequestMethod()).thenReturn("POST");
        Mockito.when(payload.getRequestContentType()).thenReturn("application/json");
        String result = extractor.extractFromBody(payload, fieldName);

        assertEquals(expectedValue, result);
    }

    @Test
    void extractFromBody_invalidJson() {
        String body = "invalid-json-body";
        String expectedValue = "";

        Mockito.when(payload.getRequestBody()).thenReturn(body);
        Mockito.when(payload.getRequestMethod()).thenReturn("POST");
        Mockito.when(payload.getRequestContentType()).thenReturn("application/json");
        String result = extractor.extractFromBody(payload, "fieldName");

        assertEquals(expectedValue, result);
    }

    @Test
    void extractFromBody_HttpMethodGet_ReturnsEmptyString() {
        Mockito.when(payload.getRequestMethod()).thenReturn("GET");

        String result = extractor.extractFromBody(payload, "/fieldName");

        assertEquals("", result);
        verifyNoMoreInteractions(payload);
    }

    private Algorithm createSigningKeyPair() throws NoSuchAlgorithmException {
        KeyPairGenerator keyPairGenerator = KeyPairGenerator.getInstance("RSA");
        keyPairGenerator.initialize(2048);
        KeyPair keyPair = keyPairGenerator.generateKeyPair();

        RSAPrivateKey privateKey = (RSAPrivateKey) keyPair.getPrivate();
        RSAPublicKey publicKey = (RSAPublicKey) keyPair.getPublic();

        return Algorithm.RSA256(publicKey, privateKey);
    }
}