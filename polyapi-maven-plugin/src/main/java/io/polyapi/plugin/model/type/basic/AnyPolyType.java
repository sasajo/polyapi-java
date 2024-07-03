package io.polyapi.plugin.model.type.basic;

import io.polyapi.plugin.model.type.PolyType;
import io.polyapi.plugin.model.type.complex.MapObjectPolyType;
import io.polyapi.plugin.model.visitor.TypeVisitor;

public class AnyPolyType extends PolyType implements MapObjectPolyType {

    @Override
    public void accept(TypeVisitor visitor) {
        visitor.visit(MapObjectPolyType.class.cast(this));
    }

    @Override
    public String getTypeName() {
        return "any";
    }
}
