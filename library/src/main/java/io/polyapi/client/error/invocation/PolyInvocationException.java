package io.polyapi.client.error.invocation;

import io.polyapi.client.error.PolyApiLibraryException;

/**
 * Parent class of all the exceptions thrown during the invocation of a Poly function.
 */
public class PolyInvocationException extends PolyApiLibraryException {
    public PolyInvocationException(String message, Throwable cause) {
        super(message, cause);
    }
}
