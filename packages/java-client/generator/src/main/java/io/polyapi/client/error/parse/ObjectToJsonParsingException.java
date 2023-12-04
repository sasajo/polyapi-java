package io.polyapi.client.error.parse;

import java.util.Optional;

import static java.lang.String.format;

/**
 * Exception thrown when an error occurs while parsing an object to JSon.
 */
public class ObjectToJsonParsingException extends ParsingException {

  /**
   * Constructor that receives the object to be parsed and the exception thrown.
   *
   * @param object The object to be parsed.
   * @param cause  The cause of the error.
   */
  public ObjectToJsonParsingException(Object object, Throwable cause) {
    super(format("An error ocurred while parsing %s to JSon.", Optional.ofNullable(object).map(Object::getClass).map(Class::getSimpleName).orElse("null")), cause);
  }
}
