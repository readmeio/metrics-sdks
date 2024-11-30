package com.readme.dataextraction;

/**
 * Defines a contract for extracting user-related data from an incoming request.
 *
 * Implementation of this interface is responsible for retrieving specific user data
 * (e.g., username, email, label) from different sources such as:
 * - JSON body
 * - HTTP headers
 * - JWT tokens
 *
 * @param <T> the type of request object from which user data will be extracted.
 *            This can be a framework-specific class (e.g., HttpServletRequest, HttpServletDataPayload).
 *
 */
public interface UserDataExtractor<T> {

    /**
     * Extracts requested data from request header
     *
     * @param payload the type of request object from which user data will be extracted.
     * @param fieldName is the enumeration to identify which field to extract
     * @return extracted value as a String
     */
    String extractFromHeader(T payload, UserDataField fieldName);

    /**
     * Extracts requested data from JSON body
     *
     * @param payload the type of request object from which user data will be extracted.
     * @param fieldName is the enumeration to identify which field to extract
     * @return extracted value as a String
     */
    String extractFromBody(T payload, UserDataField fieldName);

    /**
     * Extracts requested data from JWT token
     *
     * @param payload the type of request object from which user data will be extracted.
     * @param fieldName is the enumeration to identify which field to extract
     * @return extracted value as a String
     */
    String extractFromJwt(T payload, UserDataField fieldName);

}
