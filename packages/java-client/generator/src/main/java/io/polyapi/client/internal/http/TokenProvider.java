package io.polyapi.client.internal.http;

import static java.lang.String.format;

/**
 * Provider that handles the authentication to PolyAPI and the retrieval and maintenance of the bearer token.
 */
public interface TokenProvider {

  /**
   * Utility method to set the token as a header. Gets the token and puts it in a string in the format 'Bearer [TOKEN]'.
   *
   * @return String The formatted token.
   */
  default String getTokenAsHeader() {
    return format("Bearer %s", getToken());
  }

  /**
   * Retrieves the bearer token to use.
   *
   * @return String the token.
   */
  String getToken();
}
