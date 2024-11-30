package com.readme.dataextraction.servlets;

import java.util.Enumeration;

/**
 * This interface serves as a generic abstraction for working with HTTP requests in a way that is compatible
 * with both `javax.servlet.http.HttpServletRequest` (for example, used in Spring Boot 2) and
 * `jakarta.servlet.http.HttpServletRequest` (for example, used in Spring Boot 3).
 *
 * <p>The migration from Java EE to Jakarta EE introduced a package change from `javax` to `jakarta`,
 * leading to incompatibilities in libraries or frameworks that aim to support both versions simultaneously.
 *
 * <p>By defining a common interface, `HttpServletDataPayload` allows library developers to write code
 * that handles HTTP requests without directly depending on either `javax.servlet` or `jakarta.servlet`.
 * Concrete adapters for each implementation can wrap the respective request types, enabling a unified API
 * for collecting data from HTTP requests, such as parameters and headers, across different versions of
 * the servlet API.
 *
 * <p>This approach eliminates the need for duplicate logic and makes it easier to maintain compatibility
 * with both `javax.servlet` and `jakarta.servlet` in the same library.
 */
public interface HttpServletDataPayload {

    String getRequestBody();
    Enumeration<String> getRequestHeaders();

    String getResponseBody();
    Enumeration<String> getResponseHeaders();

}
