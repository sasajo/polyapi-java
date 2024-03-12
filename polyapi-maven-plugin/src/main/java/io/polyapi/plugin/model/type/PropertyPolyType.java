package io.polyapi.plugin.model.type;

import io.polyapi.commons.api.model.PolyObject;
import io.polyapi.plugin.model.visitor.TypeVisitor;
import lombok.Getter;
import lombok.Setter;

import java.lang.reflect.ParameterizedType;
import java.lang.reflect.Type;
import java.util.Arrays;
import java.util.Set;

import static java.lang.String.format;
import static java.util.stream.Collectors.joining;

@Getter
@Setter
public class PropertyPolyType implements PolyObject {
    private String name;
    private Boolean required;
    private PolyType type;

    public void accept(TypeVisitor visitor) {
        visitor.visit(this);
    }
}
