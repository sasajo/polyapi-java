package io.polyapi.client.error.invocation.delegate;

import io.polyapi.client.error.invocation.PolyInvocationException;
import lombok.Getter;

import static java.lang.String.format;

/**
 * Exception that indicates errors in the delegate of a Poly client function.
 */
@Getter
public class DelegateException extends PolyInvocationException {
    private final Class<?> polyApiInterface;

    public DelegateException(String message, Class<?> polyApiInterface, Throwable cause) {
        super(format(message, polyApiInterface.getName()), cause);
        this.polyApiInterface = polyApiInterface;
    }

    public String getDelegateClassName() {
        return format("%sDelegate", polyApiInterface);
    }
}
