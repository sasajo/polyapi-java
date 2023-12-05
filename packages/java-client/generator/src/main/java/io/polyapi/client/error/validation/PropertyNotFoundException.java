package io.polyapi.client.error.validation;

/**
 * Exception thrown when a property sought after is not found.
 */
public class PropertyNotFoundException extends ValidationException {
  /**
   * @see ValidationException#ValidationException(String, String)
   */
  public PropertyNotFoundException(String propertyName) {
    super(propertyName, "Property '%s' not found as parameter nor as part of plugin configuration.");
  }
}
