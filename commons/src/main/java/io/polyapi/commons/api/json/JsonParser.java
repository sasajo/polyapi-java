package io.polyapi.commons.api.json;

import java.io.InputStream;
import java.lang.reflect.Type;

/**
 * Interface for objects that convert to and from JSON.
 */
public interface JsonParser {

  /**
   * Converts an object to a JSON String.
   *
   * @param object The object to convert.
   * @return String The JSON value for the object.
   */
  String toJsonString(Object object);

  /**
   * Converts an object to a JSON InputStream.
   *
   * @param object The object to convert.
   * @return InputStream The JSON value for the object.
   */
  InputStream toJsonInputStream(Object object);

  /**
   * Converts a JSON {@link String} to an Object of the indicated {@link Type}.
   *
   * @param json                 The JSON to parse.
   * @param expectedResponseType The expected type.
   * @param <O>                  The type of the result.
   * @return Object The parsed object.
   */
  <O> O parseString(String json, Type expectedResponseType);

  /**
   * Converts a JSON {@link InputStream} to an Object of the indicated {@link Type}.
   *
   * @param json                 The JSON to parse.
   * @param expectedResponseType The expected type.
   * @param <O>                  The type of the result.
   * @return Object The parsed object.
   */
  <O> O parseInputStream(InputStream json, Type expectedResponseType);

  /**
   * Converts a {@link Type} into a JSON schema.
   *
   * @param type The Type to convert.
   * @return String The JSON schema.
   */
  String toJsonSchema(Type type);
}
