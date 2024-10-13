package com.readme.example;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Collection;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

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
    public String createOwl(@PathVariable String owlName) {
        UUID owlUuid = UUID.randomUUID();
        owlStorage.put(owlUuid.toString(), owlName);
        return "Owl " + owlName + " is created wit id: " + owlUuid;
    }
}