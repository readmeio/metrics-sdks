package com.readme.spring.datacollection.userinfo;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Represents a mapping source for extracting data from HTTP requests.
 * <p>
 * A FieldMapping consists of a source type (e.g., header, jwtClaim, or jsonBody)
 * and a fieldName that corresponds to the field's name or claim in the HTTP request.
 * </p>
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
public class FieldMapping {

    private String source;
    private String fieldName;

}
