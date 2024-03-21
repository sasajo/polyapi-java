package io.polyapi.plugin.mojo.validation;

import io.polyapi.plugin.error.validation.InexistentFileException;
import io.polyapi.plugin.error.validation.InvalidPortNumberException;
import io.polyapi.plugin.error.validation.NullOrEmptyValueException;
import lombok.extern.slf4j.Slf4j;

import java.io.File;
import java.util.Optional;

import static java.util.function.Predicate.not;

@Slf4j
public class Validator {

    /**
     * Validates that a determined named {@link String} is not null, empty nor filled only with blank spaces.
     *
     * @param propertyName The name of the validated object.
     * @param object       The object to validate.
     */
    public static void validateNotEmpty(String propertyName, String object) {
        log.debug("Validating that property '{}' is not null nor empty.", propertyName);
        Optional.ofNullable(object)
                .map(String::trim)
                .filter(not(String::isEmpty))
                .orElseThrow(() -> new NullOrEmptyValueException(propertyName));
        log.trace("Property '{}' value is '{}'.", propertyName, object);
    }

    /**
     * Validates that a determined named path is not null and points to an existing file.
     *
     * @param propertyName The name of the validated path.
     * @param file         The file to validate.
     */
    public static void validateFileExistence(String propertyName, File file) {
        log.debug("Validating that property '{}' exists as a file.", propertyName);
        Optional.ofNullable(file)
                .filter(File::exists)
                .orElseThrow(() -> new InexistentFileException(propertyName, file));
        log.trace("Property '{}' exists as a file in path {}.", propertyName, file.getAbsolutePath());
    }

    public static void validatePortFormat(String propertyName, String property) {
        log.debug("Validating that property '{}' has a valid port format.", propertyName);
        validateNotEmpty(propertyName, property);
        try {
            Integer value = Integer.valueOf(property);
            if (value > 0xFFFF || value < 0) { // 0xFFFF is the maximum port number (65535)
                throw new InvalidPortNumberException(propertyName, property);
            }
        } catch (NumberFormatException e) {
            throw new InvalidPortNumberException(propertyName, property, e);
        }
    }
}
