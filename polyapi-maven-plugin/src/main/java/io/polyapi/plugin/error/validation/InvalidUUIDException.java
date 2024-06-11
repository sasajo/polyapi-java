package io.polyapi.plugin.error.validation;

import static java.lang.String.format;

public class InvalidUUIDException extends ValidationException {
    public InvalidUUIDException(String propertyName, String propertyValue, Throwable cause) {
        super(propertyName, format("Property '%s' with value '%s' doesn't match UUID format.", propertyName, propertyValue), cause);
    }
}
