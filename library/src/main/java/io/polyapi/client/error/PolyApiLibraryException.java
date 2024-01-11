package io.polyapi.client.error;

import io.polyapi.commons.api.error.PolyApiException;

/**
 * Parent class of all the exceptions thrown by this library executions.
 */
public class PolyApiLibraryException extends PolyApiException {
    /**
     * @see PolyApiException#PolyApiException()
     */
    public PolyApiLibraryException() {
        super();
    }

    /**
     * @see PolyApiException#PolyApiException(String)
     */
    public PolyApiLibraryException(String message) {
        super(message);
    }

    /**
     * @see PolyApiException#PolyApiException(String, Throwable)
     */
    public PolyApiLibraryException(String message, Throwable cause) {
        super(message, cause);
    }

    /**
     * @see PolyApiException#PolyApiException(Throwable)
     */
    public PolyApiLibraryException(Throwable cause) {
        super(cause);
    }
}
