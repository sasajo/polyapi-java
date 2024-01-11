package io.polyapi.client.error.invocation.delegate;

/**
 * Exception thrown when the default constructor of a delegate is missing.
 */
public class MissingDefaultConstructorException extends DelegateException {
    public MissingDefaultConstructorException(Class<?> polyApiInterface, Throwable cause) {
        super("The class (%s) containing the function to execute does not declare a public default constructor. Please update it to include one such constructor.", polyApiInterface, cause);
    }
}
