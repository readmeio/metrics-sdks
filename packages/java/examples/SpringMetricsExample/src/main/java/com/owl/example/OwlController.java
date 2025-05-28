package com.owl.example;

import com.readme.core.datatransfer.har.HttpStatus;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

/**
 * OwlController is a sample REST controller intended for demonstration and testing purposes.
 * <p>
 * It simulates typical HTTP requests and responses to showcase how the ReadMe Metrics SDK
 * integrates into a Spring Boot application.
 * <p>
 * This controller is not intended for production use and serves only as an example endpoint
 * to test how the SDK logs and processes different request types.
 */
@RestController
public class OwlController {

    private final Map<String, String> owlStorage = new HashMap<>();

    public OwlController() {
        owlStorage.put("1", "Default Owl");
    }

    @GetMapping("/owl/{id}")
    public String getOwlById(@PathVariable String id) {
        return "Owl with id " + id;
    }

    @GetMapping("/owls")
    public Collection<String> getAllOwl() {
        return owlStorage.values();
    }

    @PutMapping("/owl/{owlName}")
    public ResponseEntity<String> createOwl(@PathVariable String owlName, @RequestBody String body) {
        UUID birdId = UUID.randomUUID();
        owlStorage.put(birdId.toString(), owlName);

        String responseBody = "Bird " + owlName + " created a bird with id: " + birdId + "\n" +
                "Creation request body: \n" + body;

        HttpHeaders headers = new HttpHeaders();
        headers.add("bird-id", birdId.toString());
        headers.add("bird-token", Base64.getEncoder()
                .encodeToString(birdId.toString()
                        .getBytes()));

        return ResponseEntity.status(HttpStatus.CREATED.getCode())
                .headers(headers)
                .body(responseBody);
    }

    @PutMapping(value = "/owl/urlencoded/{owlName}", consumes = MediaType.APPLICATION_FORM_URLENCODED_VALUE)
    public ResponseEntity<String> createOwlUrlencoded(@RequestParam Map<String, String> params) {
        UUID birdId = UUID.randomUUID();

        String responseBody = "Created a bird with id: " + birdId + "\n" +
                "Creation request urlencoded body: \n" + params;

        HttpHeaders headers = new HttpHeaders();
        headers.add("bird-id", birdId.toString());
        headers.add("bird-token", Base64.getEncoder()
                .encodeToString(birdId.toString()
                        .getBytes()));

        return ResponseEntity.status(HttpStatus.CREATED.getCode())
                .headers(headers)
                .body(responseBody);
    }

}