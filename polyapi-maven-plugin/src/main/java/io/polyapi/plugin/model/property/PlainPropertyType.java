package io.polyapi.plugin.model.property;

import lombok.Getter;
import lombok.Setter;

import java.util.HashSet;
import java.util.Set;

@Getter
@Setter
public class PlainPropertyType extends PropertyType {
    private String value;

    @Override
    public String getTypeSchema() {
        return null;
    }

    @Override
    public String getType(String defaultType) {
        return "String";
    }

    @Override
    public Set<String> getImports(String basePackage, String defaultType) {
        return new HashSet<>();
    }
}

