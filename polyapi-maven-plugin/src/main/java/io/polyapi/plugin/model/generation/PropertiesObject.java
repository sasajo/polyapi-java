package io.polyapi.plugin.model.generation;

import lombok.Getter;

import java.util.List;
import java.util.Set;

@Getter
public class PropertiesObject implements Generable {

    private final String packageName;
    private final Set<String> imports;
    private final String className;
    private final List<KeyValuePair<String, String>> properties;

    public PropertiesObject(String packageName, Set<String> imports, String className, List<KeyValuePair<String, String>> properties) {
        this.packageName = packageName;
        this.imports = imports;
        this.className = className;
        this.properties = properties;
    }
}
