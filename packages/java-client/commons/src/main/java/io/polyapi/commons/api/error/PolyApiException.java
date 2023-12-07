package io.polyapi.commons.api.error;

/**
 * Default exception that wraps all exceptions thrown as part of the normal usage of Poly API tools.
 */
public class PolyApiException extends RuntimeException {

  /**
   * @see RuntimeException#RuntimeException()
   */
  public PolyApiException() {
    super();
  }

  /**
   * @see RuntimeException#RuntimeException(String)
   */
  public PolyApiException(String message) {
    super(message);
  }

  /**
   * @see RuntimeException#RuntimeException(String, Throwable)
   */
  public PolyApiException(String message, Throwable cause) {
    super(message, cause);
  }

  /**
   * @see RuntimeException#RuntimeException(Throwable)
   */
  public PolyApiException(Throwable cause) {
    super(cause);
  }
}
