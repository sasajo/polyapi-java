package io.polyapi.client.error.parse;

import io.polyapi.client.error.PolyApiClientException;

/**
 * Parent exception of all the exceptions thrown when parsing to or from JSon.
 */
public class ParsingException extends PolyApiClientException {

  /**
   * @see PolyApiClientException#PolyApiClientException(String, Throwable)
   */
  public ParsingException(String message, Throwable cause) {
    super(message, cause);
  }
}
