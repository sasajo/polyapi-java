package io.polyapi.plugin.model.property;

import java.util.HashSet;
import java.util.Set;

public class VoidPropertyType extends PropertyType {
    @Override
    public String getInCodeType() {
        return "void";
    }

    @Override
    public String getTypeSchema() {
        return null;
    }

    @Override
    public String getResultType(String defaultType) {
        return "void";
    }

    @Override
    public Set<String> getImports(String basePackage, String defaultType) {
        return new HashSet<>();
    }
}
