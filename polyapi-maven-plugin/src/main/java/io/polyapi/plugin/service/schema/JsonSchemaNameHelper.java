package io.polyapi.plugin.service.schema;

import com.fasterxml.jackson.databind.JsonNode;
import org.jsonschema2pojo.GenerationConfig;
import org.jsonschema2pojo.util.NameHelper;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * A NameHelper that preserves trailing numeric suffixes on JSON property names
 * and maps '+' to 'Plus' and '-' to 'Minus'.
 */
public class JsonSchemaNameHelper extends NameHelper {

    private static final Pattern SUFFIX_PATTERN = Pattern.compile("^(.*?)(_\\d+)$");

    public JsonSchemaNameHelper(GenerationConfig config) {
        super(config);
    }

    @Override
    public String replaceIllegalCharacters(String name) {
        String mapped = name.replace("+", "Plus").replace("-", "Minus");
        return super.replaceIllegalCharacters(mapped);
    }

    @Override
    public String getPropertyName(String jsonName, JsonNode node) {
        String mapped = jsonName.replace("+", "Plus").replace("-", "Minus");
        Matcher m = SUFFIX_PATTERN.matcher(mapped);
        String base = mapped;
        String suffix = "";
        if (m.matches()) {
            base = m.group(1);
            suffix = m.group(2).replaceAll("[^0-9]", "");
        }
        String javaBase = super.getPropertyName(base, node);
        if (!suffix.isEmpty()) {
            javaBase = javaBase + suffix;
        }
        return javaBase;
    }

    @Override
    public String getClassName(String raw, JsonNode node) {
        String mapped = raw.replace("+", "Plus").replace("-", "Minus");
        return super.getClassName(mapped, node);
    }
}
