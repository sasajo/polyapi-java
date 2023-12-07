package io.polyapi.plugin.error;

import io.polyapi.commons.api.error.PolyApiException;

public class PolyAPIMavenPluginException extends PolyApiException {
  /**
   * @see PolyApiException#PolyApiException()
   */
  public PolyAPIMavenPluginException() {
    super();
  }

  /**
   * @see PolyApiException#PolyApiException(String)
   */
  public PolyAPIMavenPluginException(String message) {
    super(message);
  }

  /**
   * @see PolyApiException#PolyApiException(String, Throwable)
   */
  public PolyAPIMavenPluginException(String message, Throwable cause) {
    super(message, cause);
  }

  /**
   * @see PolyApiException#PolyApiException(Throwable)
   */
  public PolyAPIMavenPluginException(Throwable cause) {
    super(cause);
  }

}
