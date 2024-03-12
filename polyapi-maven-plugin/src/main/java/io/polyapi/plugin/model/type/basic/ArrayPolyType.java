package io.polyapi.plugin.model.type.basic;

import io.polyapi.plugin.model.type.PolyType;
import io.polyapi.plugin.model.visitor.TypeVisitor;
import lombok.Getter;
import lombok.Setter;

import java.util.List;
import java.util.Set;
import java.util.stream.Stream;

import static java.lang.String.format;
import static java.util.stream.Collectors.toSet;
import static java.util.stream.Stream.concat;

@Getter
@Setter
public class ArrayPolyType extends PolyType {
    private PolyType items;

    public void accept(TypeVisitor visitor) {
        visitor.visit(this);
    }
}
