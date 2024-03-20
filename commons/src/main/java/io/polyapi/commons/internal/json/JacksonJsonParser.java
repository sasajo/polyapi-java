package io.polyapi.commons.internal.json;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.kjetland.jackson.jsonSchema.JsonSchemaGenerator;
import io.polyapi.commons.api.error.parse.JsonToObjectParsingException;
import io.polyapi.commons.api.error.parse.ObjectToJsonParsingException;
import io.polyapi.commons.api.json.JsonParser;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.io.IOUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.lang.reflect.Type;
import java.nio.charset.Charset;
import java.util.Optional;

import static com.fasterxml.jackson.databind.DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES;
import static com.fasterxml.jackson.databind.type.TypeFactory.defaultInstance;
import static java.nio.charset.Charset.defaultCharset;

/**
 * Wrapper class around the Jackson mapping library to handle all the errors it can throw and unify all the configuration for it.
 */
@Slf4j
public class JacksonJsonParser implements JsonParser {
    private final ObjectMapper objectMapper;
    private final JsonSchemaGenerator jsonSchemaGenerator;

    /**
     * Utility constructor that uses a standard {@link ObjectMapper} instance.
     */
    public JacksonJsonParser() {
        this(new ObjectMapper().configure(FAIL_ON_UNKNOWN_PROPERTIES, false));
    }

    /**
     * Default constructor that receives an {@link ObjectMapper}.
     *
     * @param objectMapper The object mapper.
     */
    public JacksonJsonParser(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
        this.jsonSchemaGenerator = new JsonSchemaGenerator(objectMapper);
    }

    /**
     * @see JsonParser#toJsonString(Object)
     */
    @Override
    public String toJsonString(Object object) {
        try {
            log.debug("Parsing object of type {} to String.", object.getClass().getSimpleName());
            String result = objectMapper.writeValueAsString(object);
            log.debug("Parsing successful.");
            if (log.isTraceEnabled()) {
                log.trace("Parsed result is:\n{}", result);
            }
            return result;
        } catch (JsonProcessingException e) {
            throw new ObjectToJsonParsingException(object, e);
        }
    }

    /**
     * @see JsonParser#toJsonInputStream(Object)
     */
    @Override
    public InputStream toJsonInputStream(Object object) {
        try {
            log.debug("Parsing object of type {} to InputStream.", Optional.ofNullable(object).map(Object::getClass).map(Class::getName).orElse("null"));
            InputStream result = new ByteArrayInputStream(object == null ? new byte[]{} : objectMapper.writeValueAsBytes(object));
            log.debug("Parsing successful.");
            if (log.isTraceEnabled()) {
                log.trace("Parsed result is:\n{}", IOUtils.toString(result, defaultCharset()));
                log.trace("Resetting InputStream.");
                result.reset();
                log.trace("InputStream reset.");
            }
            return result;
        } catch (IOException e) {
            throw new ObjectToJsonParsingException(object, e);
        }
    }

    /**
     * @see JsonParser#parseString(String, Type)
     */
    @Override
    public <O> O parseString(String json, Type expectedResponseType) {
        try {
            if (log.isTraceEnabled()) {
                log.trace("Input to parse is:\n{}", json);
            }
            log.debug("Parsing JSon String to object of type {}.", expectedResponseType.getTypeName());
            O result = objectMapper.readValue(json, defaultInstance().constructType(expectedResponseType));
            log.debug("Parsing successful.");
            return result;
        } catch (IOException e) {
            throw new JsonToObjectParsingException(json, expectedResponseType, e);
        }
    }

    /**
     * @see JsonParser#parseInputStream(InputStream, Type)
     */
    @Override
    public <O> O parseInputStream(InputStream json, Type expectedResponseType) {
        try {
            if (log.isTraceEnabled()) {
                log.trace("Converting InputStream to String to be able to log its contents.");
                String compiledInputStream = IOUtils.toString(json, defaultCharset());
                log.trace("Input to parse is:\n{}", compiledInputStream);
                log.trace("Creating ByteArrayInputStream with the printed contents and using this instead of the argument.");
                json = new ByteArrayInputStream(compiledInputStream.getBytes(defaultCharset()));
                log.trace("ByteArrayInputStream created successfully.");
            }
            log.debug("Parsing JSon InputStream to object of type {}.", expectedResponseType.getTypeName());

            O result;
            if (expectedResponseType == String.class) {
                result = (O) IOUtils.toString(json, Charset.defaultCharset());
            } else {
                result = objectMapper.readValue(json, defaultInstance().constructType(expectedResponseType));
            }

            log.debug("Parsing successful.");
            return result;
        } catch (IOException e) {
            throw new JsonToObjectParsingException(json, expectedResponseType, e);
        }
    }

    /**
     * @see JsonParser#toJsonSchema(Type)
     */
    @Override
    public String toJsonSchema(Type type) {
        log.debug("Generating JSon schema for class '{}'", type.getTypeName());
        JsonNode schema = jsonSchemaGenerator.generateJsonSchema(defaultInstance().constructType(type));
        log.debug("Schema generated. Converting to String.");
        String result = toJsonString(schema);
        log.debug("JSon converted successfully.");
        return result;
    }
}
