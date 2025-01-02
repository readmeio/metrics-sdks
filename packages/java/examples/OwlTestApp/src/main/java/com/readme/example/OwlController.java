package com.readme.example;

import com.readme.datatransfer.har.HttpStatus;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
public class OwlController {

    @Value("${readme.readmeApiKey}")
    private String readmeApiKey;

    private final Map<String, String> owlStorage = new HashMap<>();

    public OwlController() {
        owlStorage.put("1", "Default Owl");
    }

    @GetMapping("/owl/{id}")
    public String getOwlById(@PathVariable String id) {
        return "Owl with id " + id + " and key is " + readmeApiKey;
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
}