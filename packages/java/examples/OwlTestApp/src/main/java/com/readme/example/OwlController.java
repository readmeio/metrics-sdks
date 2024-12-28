package com.readme.example;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.*;

import java.util.Collection;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

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
    public String createOwl(@PathVariable String owlName, @RequestBody String body) {
        UUID owlUuid = UUID.randomUUID();
        owlStorage.put(owlUuid.toString(), owlName);
        return "Owl " + owlName + " is created with id: " + owlUuid + "\n" +
                " Creation request body: \n" + body;
    }
}