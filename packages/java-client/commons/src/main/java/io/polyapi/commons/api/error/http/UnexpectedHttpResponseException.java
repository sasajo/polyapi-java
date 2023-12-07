package io.polyapi.commons.api.error.http;

import io.polyapi.commons.api.http.Response;

import static java.lang.String.format;

/**
 * Exception thrown when the error code of an HTTP response is not within the expected ones.
 */
public class UnexpectedHttpResponseException extends HttpResponseException {

  /**
   * Constructor that includes a default message for the exception.
   *
   * @param response The response that triggered the exception.
   */
  public UnexpectedHttpResponseException(Response response) {
    this(format("An unexpected status code received in the response. Status code: %s.", response.statusCode()), response);
  }

  /**
   * @see HttpResponseException#HttpResponseException(String, Response)
   */
  public UnexpectedHttpResponseException(String message, Response response) {
    super(message, response);
  }
}
