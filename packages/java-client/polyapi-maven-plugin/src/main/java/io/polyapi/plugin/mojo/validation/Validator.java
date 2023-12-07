package io.polyapi.plugin.mojo.validation;

import io.polyapi.plugin.error.validation.InexistentFileException;
import io.polyapi.plugin.error.validation.InvalidPortNumberException;
import io.polyapi.plugin.error.validation.NullOrEmptyValueException;

import java.io.File;
import java.net.SocketPermission;
import java.util.Optional;
import java.util.function.IntPredicate;

import static java.util.function.Predicate.not;

public class Validator {

  /**
   * Validates that a determined named {@link String} is not null, empty nor filled only with blank spaces.
   *
   * @param propertyName The name of the validated object.
   * @param object       The object to validate.
   */
  public static void validateNotEmpty(String propertyName, String object) {
    Optional.ofNullable(object)
      .map(String::trim)
      .filter(not(String::isEmpty))
      .orElseThrow(() -> new NullOrEmptyValueException(propertyName));
  }

  /**
   * Validates that a determined named path is not null and points to an existing file.
   *
   * @param propertyName The name of the validated path.
   * @param file         The file to validate.
   */
  public static void validateFileExistence(String propertyName, File file) {
    Optional.ofNullable(file)
      .filter(File::exists)
      .orElseThrow(() -> new InexistentFileException(propertyName, file));
  }

  public static void validatePortFormat(String propertyName, String property) {
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
