package io.polyapi.plugin.service.schema;

import org.jsonschema2pojo.GenerationConfig;
import org.jsonschema2pojo.util.NameHelper;

import java.util.regex.Pattern;

public class JsonSchemaNameHelper extends NameHelper {
    public JsonSchemaNameHelper(GenerationConfig generationConfig) {
        super(generationConfig);
    }

    public String replaceIllegalCharacters(String name) {
        return super.replaceIllegalCharacters(name.replaceAll("\\+", "Plus").replaceAll("-", "Minus"));
    }
}
