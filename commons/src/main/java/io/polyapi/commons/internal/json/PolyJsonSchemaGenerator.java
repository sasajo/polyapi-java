package io.polyapi.commons.internal.json;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.kjetland.jackson.jsonSchema.JsonSchemaGenerator;

/**
 * Custom {@link JsonSchemaGenerator} that removes the spaces from the generated titles.
 */
public class PolyJsonSchemaGenerator extends JsonSchemaGenerator {
    public PolyJsonSchemaGenerator(ObjectMapper rootObjectMapper) {
        super(rootObjectMapper);
    }

    /**
     * @see JsonSchemaGenerator#generateTitleFromPropertyName(String)
     */
    @Override
    public String generateTitleFromPropertyName(final String propertyName) {
        return super.generateTitleFromPropertyName(propertyName).replace(" ", "");
    }
}
