package com.owl.kotlin_example

import com.readme.core.datatransfer.har.HttpStatus
import org.springframework.http.HttpHeaders
import org.springframework.http.MediaType
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import java.util.*
import java.util.Base64

@RestController
class OwlController {

    private val owlStorage: MutableMap<String, String> = mutableMapOf("1" to "Default Owl")

    @GetMapping("/owl/{id}")
    fun getOwlById(@PathVariable id: String): String {
        return "Owl with id $id"
    }

    @GetMapping("/owls")
    fun getAllOwl(): Collection<String> {
        return owlStorage.values
    }

    @PutMapping("/owl/{owlName}")
    fun createOwl(@PathVariable owlName: String, @RequestBody body: String): ResponseEntity<String> {
        val birdId = UUID.randomUUID()
        owlStorage[birdId.toString()] = owlName

        val responseBody = buildString {
            append("Bird $owlName created a bird with id: $birdId\n")
            append("Creation request body: \n$body")
        }

        val headers = HttpHeaders().apply {
            add("bird-id", birdId.toString())
            add("bird-token", Base64.getEncoder().encodeToString(birdId.toString().toByteArray()))
        }

        return ResponseEntity
            .status(HttpStatus.CREATED.code)
            .headers(headers)
            .body(responseBody)
    }

    @PutMapping("/owl/urlencoded/{owlName}", consumes = [MediaType.APPLICATION_FORM_URLENCODED_VALUE])
    fun createOwlUrlencoded(@RequestParam params: Map<String, String>): ResponseEntity<String> {
        val birdId = UUID.randomUUID()

        val responseBody = buildString {
            append("Created a bird with id: $birdId\n")
            append("Creation request urlencoded body: \n$params")
        }

        val headers = HttpHeaders().apply {
            add("bird-id", birdId.toString())
            add("bird-token", Base64.getEncoder().encodeToString(birdId.toString().toByteArray()))
        }

        return ResponseEntity
            .status(HttpStatus.CREATED.code)
            .headers(headers)
            .body(responseBody)
    }
}