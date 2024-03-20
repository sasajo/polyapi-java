package io.polyapi.plugin.model.visitor;

import io.polyapi.plugin.model.specification.variable.VariablePolyType;
import io.polyapi.plugin.model.type.PolyType;
import io.polyapi.plugin.model.type.PropertyPolyType;
import io.polyapi.plugin.model.type.basic.ArrayPolyType;
import io.polyapi.plugin.model.type.basic.PlainPolyType;
import io.polyapi.plugin.model.type.basic.VoidPolyType;
import io.polyapi.plugin.model.type.complex.*;
import io.polyapi.plugin.model.type.complex.MapObjectPolyType;
import io.polyapi.plugin.model.type.complex.ObjectPolyType;
import io.polyapi.plugin.model.type.function.FunctionSpecPolyType;
import io.polyapi.plugin.model.type.function.FunctionPolyType;
import io.polyapi.plugin.model.type.primitive.PrimitivePolyType;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public interface TypeVisitor {
    Logger log = LoggerFactory.getLogger(TypeVisitor.class);

    default void visit(PolyType polyType) {
        log.trace("Visiting PolyType.");
        // Do nothing.
    }

    default void visit(ObjectPolyType type) {
        log.trace("Visiting ObjectPolyType.");
        visit((PolyType) type);
    }

    default void visit(SchemaObjectPolyType type) {
        log.trace("Visiting SchemaObjectPolyType.");
        visit((ObjectPolyType) type);
    }

    default void visit(PropertiesObjectPolyType type) {
        log.trace("Visiting PropertiesObjectPolyType.");
        visit((ObjectPolyType) type);
    }

    default void visit(MapObjectPolyType type) {
        log.trace("Visiting MapObjectPolyType.");
        visit((ObjectPolyType) type);
    }

    default void visit(PlainPolyType type) {
        log.trace("Visiting PlainPolyType.");
        visit((PolyType) type);
    }

    default void visit(VoidPolyType type) {
        log.trace("Visiting VoidPolyType.");
        visit((PolyType) type);
    }

    default void visit(ArrayPolyType type) {
        log.trace("Visiting ArrayPolyType.");
        type.getItems().accept(this);
    }

    default void visit(FunctionSpecPolyType type) {
        log.trace("Visiting FunctionSpecPolyType.");
        type.getArguments().forEach(argument -> argument.accept(this));
        type.getReturnType().accept(this);
    }

    default void visit(VariablePolyType type) {
        log.trace("Visiting VariablePolyType.");
        type.getValueType().accept(this);
    }

    default void visit(FunctionPolyType type) {
        log.trace("Visiting FunctionPolyType.");
        type.getSpec().accept(this);
    }

    default void visit(PropertyPolyType type) {
        log.trace("Visiting PropertyPolyType.");
        type.getType().accept(this);
    }


    default void visit(PrimitivePolyType type) {
        log.trace("Visiting PrimitivePolyType.");
        visit((PolyType) type);
    }
}
