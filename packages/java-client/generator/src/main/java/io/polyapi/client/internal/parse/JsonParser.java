package io.polyapi.client.internal.parse;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.polyapi.client.error.parse.JsonToObjectParsingException;
import io.polyapi.client.error.parse.ObjectToJsonParsingException;
import org.apache.commons.io.IOUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.lang.reflect.Type;

import static com.fasterxml.jackson.databind.type.TypeFactory.defaultInstance;
import static java.nio.charset.Charset.defaultCharset;

/**
 * Wrapper class around the JSon mapping library to handle all the errors it can throw and unify all the configuration for it.
 */
public class JsonParser {
  private static final Logger logger = LoggerFactory.getLogger(JsonParser.class);
  private final ObjectMapper objectMapper;

  public JsonParser(ObjectMapper objectMapper) {
    this.objectMapper = objectMapper;
  }

  /**
   * Converts an object to a JSon String.
   *
   * @param object The object to convert.
   * @return String The JSon value for the object.
   */
  public String toJsonString(Object object) {
    try {
      logger.debug("Parsing object of type {} to String.", object.getClass().getSimpleName());
      String result = objectMapper.writeValueAsString(object);
      logger.debug("Parsing successful.");
      if (logger.isTraceEnabled()) {
        logger.trace("Parsed result is:\n{}", result);
      }
      return result;
    } catch (JsonProcessingException e) {
      throw new ObjectToJsonParsingException(object, e);
    }
  }

  /**
   * Converts an object to a JSon InputStream.
   *
   * @param object The object to convert.
   * @return InputStream The JSon value for the object.
   */
  public InputStream toJsonInputStream(Object object) {
    try {
      logger.debug("Parsing object of type {} to InputStream.", object.getClass().getSimpleName());
      InputStream result = new ByteArrayInputStream(objectMapper.writeValueAsBytes(object));
      logger.debug("Parsing successful.");
      if (logger.isTraceEnabled()) {
        logger.trace("Parsed result is:\n{}", IOUtils.toString(result, defaultCharset()));
        logger.trace("Reseting InputStream.");
        result.reset();
        logger.trace("InputStream reset.");
      }
      return result;
    } catch (IOException e) {
      throw new ObjectToJsonParsingException(object, e);
    }
  }

  /**
   * Converts a JSon {@link String} to an Object of the indicated {@link Type}.
   *
   * @param json                 The JSon to parse.
   * @param expectedResponseType The expected type.
   * @param <O>                  The type of the result.
   * @return Object The parsed object.
   */
  public <O> O parseString(String json, Type expectedResponseType) {
    try {
      if (logger.isTraceEnabled()) {
        logger.trace("Input to parse is:\n{}", json);
      }
      logger.debug("Parsing JSon String to object of type {}.", expectedResponseType.getTypeName());
      O result = objectMapper.readValue(json, defaultInstance().constructType(expectedResponseType));
      logger.debug("Parsing successful.");
      return result;
    } catch (IOException e) {
      throw new JsonToObjectParsingException(json, expectedResponseType, e);
    }
  }

  /**
   * Converts a JSon {@link InputStream} to an Object of the indicated {@link Type}.
   *
   * @param json                 The JSon to parse.
   * @param expectedResponseType The expected type.
   * @param <O>                  The type of the result.
   * @return Object The parsed object.
   */
  public <O> O parseInputStream(InputStream json, Type expectedResponseType) {
    try {
      if (logger.isTraceEnabled()) {
        logger.trace("Converting InputStream to String to be able to log its contents.");
        String compiledInputStream = IOUtils.toString(json, defaultCharset());
        logger.trace("Input to parse is:\n{}", compiledInputStream);
        logger.trace("Creating ByteArrayInputStream with the printed contents and using this instead of the argument.");
        json = new ByteArrayInputStream(compiledInputStream.getBytes(defaultCharset()));
        logger.trace("ByteArrayInputStream created successfully.");
      }
      logger.debug("Parsing JSon InputStream to object of type {}.", expectedResponseType.getTypeName());
      O result = objectMapper.readValue(json, defaultInstance().constructType(expectedResponseType));
      logger.debug("Parsing successful.");
      return result;
    } catch (IOException e) {
      throw new JsonToObjectParsingException(json, expectedResponseType, e);
    }
  }
}
