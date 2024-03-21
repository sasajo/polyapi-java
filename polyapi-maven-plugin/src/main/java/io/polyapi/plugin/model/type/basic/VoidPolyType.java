package io.polyapi.plugin.model.type.basic;

import io.polyapi.plugin.model.type.PolyType;
import io.polyapi.plugin.model.visitor.TypeVisitor;

public class VoidPolyType extends PolyType {

    public void accept(TypeVisitor visitor) {
        visitor.visit(this);
    }
}
