package io.polyapi.plugin.error.validation;

import static java.lang.String.format;

public class BadExclusionException extends ValidationException {
    public BadExclusionException(String propertyName, String excludedPropertyName) {
        super(propertyName, format("Property '%s' cannot be set at the same time as property '%s'.", "%s", excludedPropertyName));
    }
}
