package com.readme.exception;

public class EmptyRequestBodyException extends RuntimeException {

    public EmptyRequestBodyException() {
        super("The request body cannot be empty");
    }
}
