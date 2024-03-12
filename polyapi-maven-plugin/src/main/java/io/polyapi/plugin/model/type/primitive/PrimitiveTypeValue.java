package io.polyapi.plugin.model.type.primitive;

import com.fasterxml.jackson.annotation.JsonValue;
import io.polyapi.commons.api.model.PolyObject;
import lombok.Getter;

@Getter
public enum PrimitiveTypeValue implements PolyObject {
    STRING(String.class), NUMBER(Number.class), OBJECT(Object.class), BOOLEAN(Boolean.class);

    private final Class<?> typeClass;

    PrimitiveTypeValue(Class<?> typeClass) {
        this.typeClass = typeClass;
    }

    public String getTypeName() {
        return typeClass.getName();
    }

    @JsonValue
    public String getValue() {
        return this.name().toLowerCase();
    }
}
