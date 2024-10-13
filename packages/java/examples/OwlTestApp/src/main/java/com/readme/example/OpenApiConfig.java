package com.readme.example;

import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.info.Info;
import org.springframework.context.annotation.Configuration;

@Configuration
@OpenAPIDefinition(
        info = @Info(
                title = "Owl API",
                version = "1.0",
                description = "This is a simple API to manage owls"
        )
)
public class OpenApiConfig {
}