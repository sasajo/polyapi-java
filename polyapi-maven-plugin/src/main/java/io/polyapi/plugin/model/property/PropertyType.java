package io.polyapi.plugin.model.property;

import com.fasterxml.jackson.annotation.JsonSubTypes;
import com.fasterxml.jackson.annotation.JsonTypeInfo;

import java.util.HashSet;
import java.util.Set;

@JsonTypeInfo(
        use = JsonTypeInfo.Id.NAME,
        property = "kind"
)
@JsonSubTypes({
        @JsonSubTypes.Type(value = VoidPropertyType.class, name = "void"),
        @JsonSubTypes.Type(value = PrimitivePropertyType.class, name = "primitive"),
        @JsonSubTypes.Type(value = ArrayPropertyType.class, name = "array"),
        @JsonSubTypes.Type(value = ObjectPropertyType.class, name = "object"),
        @JsonSubTypes.Type(value = FunctionPropertyType.class, name = "function"),
        @JsonSubTypes.Type(value = PlainPropertyType.class, name = "plain")
})
public abstract class PropertyType {

    public String getInCodeType() {
        return "Object";
    }

    @Override
    public String toString() {
        return getInCodeType();
    }

    public abstract String getTypeSchema();

    public abstract String getResultType(String defaultValue);

    public Set<String> getImports(String basePackage, String defaultType) {
        return new HashSet<>();
    }
}
