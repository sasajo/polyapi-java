package io.polyapi.client.error.invocation.delegate;

/**
 * Exception thrown when the delegate class is an interface, abstract or such class that cannot be instantiated.
 */
public class InvalidDelegateClassTypeException extends DelegateException {
    public InvalidDelegateClassTypeException(Class<?> polyApiInterface, Throwable cause) {
        super("Delegate for interface '%s' cannot be instantiated because is either an abstract class, an interface or such.", polyApiInterface, cause);
    }
}
