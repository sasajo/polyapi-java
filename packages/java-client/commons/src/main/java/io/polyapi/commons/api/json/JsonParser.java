package io.polyapi.commons.api.json;

import java.io.InputStream;
import java.lang.reflect.Type;

/**
 * Interface for objects that convert to and from JSon.
 */
public interface JsonParser {

  /**
   * Converts an object to a JSon String.
   *
   * @param object The object to convert.
   * @return String The JSon value for the object.
   */
  String toJsonString(Object object);

  /**
   * Converts an object to a JSon InputStream.
   *
   * @param object The object to convert.
   * @return InputStream The JSon value for the object.
   */
  InputStream toJsonInputStream(Object object);

  /**
   * Converts a JSon {@link String} to an Object of the indicated {@link Type}.
   *
   * @param json                 The JSon to parse.
   * @param expectedResponseType The expected type.
   * @param <O>                  The type of the result.
   * @return Object The parsed object.
   */
  <O> O parseString(String json, Type expectedResponseType);

  /**
   * Converts a JSon {@link InputStream} to an Object of the indicated {@link Type}.
   *
   * @param json                 The JSon to parse.
   * @param expectedResponseType The expected type.
   * @param <O>                  The type of the result.
   * @return Object The parsed object.
   */
  <O> O parseInputStream(InputStream json, Type expectedResponseType);

  /**
   * Converts a {@link Class} into a JSon schema.
   *
   * @param clazz The class to convert.
   * @return String The JSon schema.
   */
  String toJsonSchema(Class<?> clazz);
}
