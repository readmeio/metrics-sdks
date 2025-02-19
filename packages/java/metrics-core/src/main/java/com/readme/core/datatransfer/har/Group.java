package com.readme.core.datatransfer.har;

import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class Group {
    String id;
    String label;
    String email;
}