package com.readme.webhook_example;

import com.readme.core.webhook.WebhookVerifier;
import lombok.AllArgsConstructor;
import lombok.Data;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;


@RestController
@RequestMapping("/webhook")
public class WebhookController {

    private static final String SECRET = "qyQHkaPpPL2TvZutHFyuebgKASb4sM58";

    @PostMapping(consumes = "application/json", produces = "application/json")
    public ResponseEntity<WebhookResponse> handleWebhook(@RequestBody String requestBody,
                                                         @RequestHeader("readme-signature") String signature) {
        WebhookVerifier.verifyWebhook(requestBody, signature, SECRET);
        return ResponseEntity.ok(new WebhookResponse("QaOwl"));
    }

    @Data
    @AllArgsConstructor
    public static class WebhookResponse {
        private String user;
    }
}