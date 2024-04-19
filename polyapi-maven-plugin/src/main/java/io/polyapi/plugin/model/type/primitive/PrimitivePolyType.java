package io.polyapi.plugin.model.type.primitive;

import io.polyapi.plugin.model.type.PolyType;
import io.polyapi.plugin.model.visitor.TypeVisitor;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class PrimitivePolyType extends PolyType {
    private PrimitiveTypeValue type;

    @Override
    public void accept(TypeVisitor visitor) {
        visitor.visit(this);
    }
}

