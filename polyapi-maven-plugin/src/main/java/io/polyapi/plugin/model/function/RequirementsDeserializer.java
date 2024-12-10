package io.polyapi.plugin.model.function;

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

        if (node.isArray() && node.isEmpty()) {
            return Collections.emptyList();
        }

        if (node.isArray()) {
            List<String> requirements = new ArrayList<>();
            for (JsonNode item : node) {
                if (item.isTextual()) {
                    requirements.add(item.asText());
                }
            }
            return requirements;
        }

        if (node.isTextual() && "[]".equals(node.asText())) {
            return Collections.emptyList();
        }

        return Collections.emptyList();
    }
}
