package com.readme.dataextraction.payload.user;

/**
 * Interface for extracting user-related data, such as API key, label, and email,
 * from a given source object. The source object can vary depending on the framework or context,
 * for example, it may contain {@code HttpServletRequest} and {@code HttpServletResponse}.
 *
 * This interface is designed to be flexible and reusable across different environments
 * where user-related data needs to be collected from request/response objects.
 *
 * @param <T> the type of the source object that contains the data to be extracted
 */
public interface UserDataCollector<T> {

    /**
     * Extracts user-related data from the given source object.
     *
     * This method processes the provided source object to retrieve the user's API key,
     * label, and email, encapsulating the results into a {@link UserData} model.
     * The exact extraction logic depends on the implementation and the source type.
     *
     * @param t the payload object containing the sources to get user-related data.
     *
     * @return a {@link UserData} object containing the extracted user information
     */
    UserData collect(T t);

}
