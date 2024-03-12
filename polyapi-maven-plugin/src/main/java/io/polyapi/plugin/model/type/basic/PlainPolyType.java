package io.polyapi.plugin.model.type.basic;

import io.polyapi.plugin.model.type.PolyType;
import io.polyapi.plugin.model.visitor.TypeVisitor;
import lombok.Getter;
import lombok.Setter;

import java.util.HashSet;
import java.util.Set;

@Getter
@Setter
public class PlainPolyType extends PolyType {
    private String value;

    public void accept(TypeVisitor visitor) {
        visitor.visit(this);
    }
}

