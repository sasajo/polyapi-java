package io.polyapi.plugin.error.classloader;

import io.polyapi.commons.api.error.PolyApiException;
import lombok.Getter;

/**
 * Exception thrown when the qualified name for a class is not found.
 */
@Getter
public class QualifiedNameNotFoundException extends PolyApiException {
  private final String qualifiedName;

  /**
   * Constructor that sets the qualified name and adds a message around it.
   *
   * @param qualifiedName The qualified name that wasn't found.
   * @param cause         The exception that caused this one.
   */
  public QualifiedNameNotFoundException(String qualifiedName, Throwable cause) {
    super("Class not found: " + qualifiedName + ". Make sure you have compiled your project.", cause);
    this.qualifiedName = qualifiedName;
  }
}
