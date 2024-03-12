package io.polyapi.plugin.model.generation;

import static io.polyapi.plugin.utils.StringUtils.toCamelCase;
import static io.polyapi.plugin.utils.StringUtils.toPascalCase;
import static java.lang.String.format;

public record KeyValuePair<K, V>(K key, V value) {

    @Override
    public String toString() {
        return format("%s %s", value.toString(), toCamelCase(key.toString()));
    }
}
