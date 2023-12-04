package io.polyapi.client.error.validation;

/**
 * Exception thrown when an object that should not be empty is null or empty.
 */
public class NullOrEmptyValueException extends ValidationException {

  /**
   * Constructor that indicates the property that is validated.
   *
   * @param validatedProperty The property to validate.
   */
  public NullOrEmptyValueException(String validatedProperty) {
    super(validatedProperty, "Property '%s' is empty when it shouldn't.");
  }
}
