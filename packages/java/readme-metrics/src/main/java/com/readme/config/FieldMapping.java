package com.readme.config;

import lombok.Data; /**
 * Represents a mapping source for extracting data from HTTP requests.
 * <p>
 * A FieldMapping consists of a source type (e.g., header, jwtClaim, or jsonBody)
 * and a fieldName that corresponds to the field's name or claim in the HTTP request.
 * </p>
 */
@Data
public class FieldMapping {

    private String source;
    private String fieldName;

}
