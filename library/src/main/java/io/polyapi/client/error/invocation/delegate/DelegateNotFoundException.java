package io.polyapi.client.error.invocation.delegate;

import io.polyapi.client.error.invocation.PolyInvocationException;

/**
 * Exception thrown when the sought delegate is not found.
 */
public class DelegateNotFoundException extends DelegateException {
    public DelegateNotFoundException(Class<?> polyApiInterface, Throwable cause) {
        super("Delegate for interface '%s' not found.", polyApiInterface, cause);
    }
}
