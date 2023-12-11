package io.polyapi.plugin.error;

import io.polyapi.commons.api.error.PolyApiException;

public class PolyApiMavenPluginException extends PolyApiException {
  /**
   * @see PolyApiException#PolyApiException()
   */
  public PolyApiMavenPluginException() {
    super();
  }

  /**
   * @see PolyApiException#PolyApiException(String)
   */
  public PolyApiMavenPluginException(String message) {
    super(message);
  }

  /**
   * @see PolyApiException#PolyApiException(String, Throwable)
   */
  public PolyApiMavenPluginException(String message, Throwable cause) {
    super(message, cause);
  }

  /**
   * @see PolyApiException#PolyApiException(Throwable)
   */
  public PolyApiMavenPluginException(Throwable cause) {
    super(cause);
  }

}
