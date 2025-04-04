package com.readme.core.datatransfer.har;

/**
 * Contains constants used for memory and performance optimizations throughout the SDK.
 * <p>
 * Adjusting these values helps manage memory consumption efficiently,
 * especially in high-load scenarios where many small objects (e.g., maps) are frequently created.
 */
public class MemoryOptimisationConstants {

    /**
     * Default initial capacity for maps that are typically small (1-4 entries).
     * <p>
     * Reducing the default from 16 to 8 helps minimize memory footprint
     * when numerous small maps are created, thus reducing overall memory consumption and GC overhead.
     */
    public static final int DEFAULT_MAP_INIT_CAPACITY = 8;

}
