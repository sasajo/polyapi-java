package io.polyapi.client.error.invocation.delegate;

/**
 * Exception thrown when there's an error while creating a delegate class for a Poly client function.
 */
public class DelegateCreationException extends DelegateException {
    public DelegateCreationException(Class<?> polyApiInterface, Throwable cause) {
        super("An error occurred while creating the instance of the delegate for interface %s. By default constructors shouldn't throw exceptions.", polyApiInterface, cause);
    }
}
