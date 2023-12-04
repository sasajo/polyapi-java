package io.polyapi.client.error.parse;

import lombok.Getter;
import org.apache.commons.io.IOUtils;

import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.lang.reflect.Type;
import java.nio.charset.Charset;
import java.util.Optional;

import static java.io.InputStream.nullInputStream;
import static java.lang.String.format;
import static java.nio.charset.Charset.defaultCharset;

@Getter
public class JsonToObjectParsingException extends ParsingException {

  private final Type type;
  private final InputStream json;

  /**
   * Default constructor that stores the InputStream and the type.
   *
   * @param json  The JSon that was to be converted.
   * @param type  The type to be converted to.
   * @param cause The cause of the error.
   */
  public JsonToObjectParsingException(InputStream json, Type type, Throwable cause) {
    super(format("An error ocurred while parsing JSon to %s.", type.getTypeName()), cause);
    this.type = type;
    this.json = json;
  }

  /**
   * Utility constructor that converts the JSon from a {@link String} to a {@link ByteArrayInputStream}.
   *
   * @param json  The JSon that was to be converted.
   * @param type  The type to be converted to.
   * @param cause The cause of the error.
   */
  public JsonToObjectParsingException(String json, Type type, Throwable cause) {
    this(new ByteArrayInputStream(Optional.ofNullable(json).orElse("null").getBytes(defaultCharset())), type, cause);
  }
}
