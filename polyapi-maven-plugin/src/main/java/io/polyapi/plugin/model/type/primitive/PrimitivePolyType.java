package io.polyapi.plugin.model.type.primitive;

import io.polyapi.plugin.model.type.PolyType;
import io.polyapi.plugin.model.visitor.TypeVisitor;
import lombok.Getter;
import lombok.Setter;

import java.util.HashSet;
import java.util.Set;

@Getter
@Setter
public class PrimitivePolyType extends PolyType {
    private PrimitiveTypeValue type;

    public void accept(TypeVisitor visitor) {
        visitor.visit(this);
    }
}

