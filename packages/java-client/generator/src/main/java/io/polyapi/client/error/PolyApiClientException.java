package io.polyapi.client.error;

/**
 * Default exception that wraps all exceptions thrown as part of the normal usage of this client.
 */
public class PolyApiClientException extends RuntimeException {

  /**
   * @see RuntimeException#RuntimeException()
   */
  public PolyApiClientException() {
    super();
  }

  /**
   * @see RuntimeException#RuntimeException(String)
   */
  public PolyApiClientException(String message) {
    super(message);
  }

  /**
   * @see RuntimeException#RuntimeException(String, Throwable)
   */
  public PolyApiClientException(String message, Throwable cause) {
    super(message, cause);
  }

  /**
   * @see RuntimeException#RuntimeException(Throwable)
   */
  public PolyApiClientException(Throwable cause) {
    super(cause);
  }
}
