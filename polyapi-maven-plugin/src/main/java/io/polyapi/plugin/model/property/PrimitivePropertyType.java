package io.polyapi.plugin.model.property;

import lombok.Getter;
import lombok.Setter;

import java.util.HashSet;
import java.util.Set;

@Getter
@Setter
public class PrimitivePropertyType extends PropertyType {
    private String type;  // 'string' | 'number' | 'boolean'

    @Override
    public String getInCodeType() {
        return switch (type) {
            case "string" -> "String";
            case "number" -> "Number";
            case "boolean" -> "Boolean";
            default -> "Object";
        };
    }

    @Override
    public String getTypeSchema() {
        return null;
    }

    @Override
    public String getResultType(String defaultType) {
        return getInCodeType();
    }

    @Override
    public Set<String> getImports(String basePackage, String defaultType) {
        return new HashSet<>();
    }
}

