package io.polyapi.client.error.invocation.delegate;

/**
 * Exception thrown when the declared method on the Delegate doesn't match the interface's.
 */
public class InvalidMethodDeclarationException extends DelegateException {

    public InvalidMethodDeclarationException(Class<?> polyApiInterface, Throwable cause) {
        super("Delegate methods don't match poly interface '%s'.", polyApiInterface, cause);
    }
}
