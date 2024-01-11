package io.polyapi.client.error.invocation.delegate;

/**
 * Wrapper exception thrown when the code in a delegate throws an exception of its own.
 */
public class DelegateExecutionException extends DelegateException {
    public DelegateExecutionException(Class<?> polyApiInterface, Throwable cause) {
        super("An error ocurred while executing the delegate of interface %s", polyApiInterface, cause);
    }
}
