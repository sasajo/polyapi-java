package io.polyapi.client.maven.mojo.validation;

import io.polyapi.client.error.validation.InexistentFileException;
import io.polyapi.client.error.validation.NullOrEmptyValueException;

import java.io.File;
import java.util.Optional;

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
}
