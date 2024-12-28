package com.readme.dataextraction.payload;

import com.readme.dataextraction.payload.requestresponse.ApiCallLogData;

/**
 * A generic interface for collecting metrics from various frameworks or APIs.
 *
 * <p>The {@link RequestDataCollector} interface is designed to provide a unified way
 * to handle metric collection regardless of the underlying framework or protocol.
 * By using generics, this interface can adapt to different data types or request
 * payloads specific to a given environment.
 *
 *
 * @param <T> the type of the decorator over API or framework data transfer layer
 *           from which metrics will be collected.
 *           This could represent an HTTP request, payload, or any other
 *           structure relevant to the framework being used.
 */
public interface RequestDataCollector<T> {

    /**
     * <p>`collect` method is intended to be implemented to extract and process
     * metrics data from the given input object. The exact implementation
     * will vary depending on the framework or API used.</p>
     */
    ApiCallLogData collect(T t);

}
