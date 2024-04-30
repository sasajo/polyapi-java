package io.polyapi.plugin.service.schema;

import org.jsonschema2pojo.GenerationConfig;
import org.jsonschema2pojo.util.NameHelper;

public class JsonSchemaNameHelper extends NameHelper {
    public JsonSchemaNameHelper(GenerationConfig generationConfig) {
        super(generationConfig);
    }

    @Override
    public String replaceIllegalCharacters(String name) {
        return super.replaceIllegalCharacters(name.replace("+", "Plus").replace("-", "Minus"));
    }
}
