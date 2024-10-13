package com.readme.example;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class UserController {

    @GetMapping("/users/{id}")
    public String getUserById(@PathVariable String id) {
        return "User with id " + id;
    }

    @GetMapping("/users")
    public String getAllUsers() {
        return "List of users";
    }
}