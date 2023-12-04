package io.polyapi.client.error.http;

import io.polyapi.client.error.PolyApiClientException;
import io.polyapi.client.internal.http.Response;
import lombok.Getter;

/**
 * Parent of exceptions thrown when the response from an HTTP request is different than 2XX.
 * This class contains an instance of the {@link Response} returned.
 */
@Getter
public class HttpResponseException extends PolyApiClientException {

  private final Response response;

  /**
   * Constructor that takes a message and the response returned.
   *
   * @param message  The message.
   * @param response The response.
   */
  public HttpResponseException(String message, Response response) {
    super(message);
    this.response = response;
  }
}
