package io.polyapi.plugin.error.validation;

import io.polyapi.plugin.error.PolyAPIMavenPluginException;

import static java.lang.String.format;

/**
 * Parent class for exceptions thrown for validation purposes. Stores the name of the property being validated and injects it into the message.
 */
public class ValidationException extends PolyAPIMavenPluginException {

  private final String propertyName;

  /**
   * Constructor that takes the propertyName and a message template and generates the message with them.
   *
   * @param propertyName    The name of the property being validated.
   * @param messageTemplate The message template.
   */
  public ValidationException(String propertyName, String messageTemplate) {
    super(format(messageTemplate, propertyName));
    this.propertyName = propertyName;
  }

  public String getPropertyName() {
    return propertyName;
  }
}
