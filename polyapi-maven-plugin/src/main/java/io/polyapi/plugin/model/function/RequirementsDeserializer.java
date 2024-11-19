package io.polyapi.plugin.model.function;

/*
import com.fasterxml.jackson.core.JsonParseException;
import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.JsonDeserializer;

import java.io.IOException;
import java.util.Collections;
import java.util.List;

public class RequirementsDeserializer extends JsonDeserializer<List<String>> {
    @Override
    public List<String> deserialize(JsonParser jsonParser, DeserializationContext context) throws IOException {
        String value = jsonParser.getText();
        if ("[]".equals(value)) {
            return Collections.emptyList();
        }
        throw new JsonParseException(jsonParser, "Invalid requirements format");
    }
}
*/

import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.JsonDeserializer;
import com.fasterxml.jackson.databind.JsonNode;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

public class RequirementsDeserializer extends JsonDeserializer<List<String>> {

    @Override
    public List<String> deserialize(JsonParser jsonParser, DeserializationContext context) throws IOException {
        JsonNode node = jsonParser.getCodec().readTree(jsonParser);

        // Handle empty JSON array
        if (node.isArray() && node.isEmpty()) {
            return Collections.emptyList();
        }

        // Handle valid JSON array with strings
        if (node.isArray()) {
            List<String> requirements = new ArrayList<>();
            for (JsonNode item : node) {
                if (item.isTextual()) {
                    requirements.add(item.asText());
                }
            }
            return requirements;
        }

        // Handle string input like "[]"
        if (node.isTextual() && "[]".equals(node.asText())) {
            return Collections.emptyList();
        }

        // For any other invalid input, return an empty list
        return Collections.emptyList();
    }
}
