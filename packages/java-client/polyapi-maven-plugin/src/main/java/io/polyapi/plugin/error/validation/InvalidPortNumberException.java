package io.polyapi.plugin.error.validation;

import static java.lang.String.format;

/**
 * Exception thrown when an invalid port is being set.
 */
public class InvalidPortNumberException extends ValidationException {
  private static final String MESSAGE_TEMPLATE = "Invalid port value set in property '%%s': %s. Port should be a Integer between 0 and 65535.";

  /**
   * Constructor that takes the property name validated and the port value that is being validated.
   *
   * @param propertyName The name of the property validated.
   * @param port         The value of the property validated.
   */
  public InvalidPortNumberException(String propertyName, String port) {
    super(propertyName, format(MESSAGE_TEMPLATE, port));
  }


  /**
   * Constructor that takes the property name validated, the port value that is being validated and the cause of the exception.
   *
   * @param propertyName The name of the property validated.
   * @param port         The value of the property validated.
   * @param cause The cause of the exception.
   */
  public InvalidPortNumberException(String propertyName, String port, Throwable cause) {
    super(propertyName, MESSAGE_TEMPLATE, cause);
  }
}
