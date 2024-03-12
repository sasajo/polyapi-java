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
    Logger logger = LoggerFactory.getLogger(TypeVisitor.class);

    default void visit(PolyType polyType) {
        logger.trace("Visiting PolyType.");
        // Do nothing.
    }

    default void visit(ObjectPolyType type) {
        logger.trace("Visiting ObjectPolyType.");
        visit((PolyType) type);
    }

    default void visit(SchemaObjectPolyType type) {
        logger.trace("Visiting SchemaObjectPolyType.");
        visit((ObjectPolyType) type);
    }

    default void visit(PropertiesObjectPolyType type) {
        logger.trace("Visiting PropertiesObjectPolyType.");
        visit((ObjectPolyType) type);
    }

    default void visit(MapObjectPolyType type) {
        logger.trace("Visiting MapObjectPolyType.");
        visit((ObjectPolyType) type);
    }

    default void visit(PlainPolyType type) {
        logger.trace("Visiting PlainPolyType.");
        visit((PolyType) type);
    }

    default void visit(VoidPolyType type) {
        logger.trace("Visiting VoidPolyType.");
        visit((PolyType) type);
    }

    default void visit(ArrayPolyType type) {
        logger.trace("Visiting ArrayPolyType.");
        type.getItems().accept(this);
    }

    default void visit(FunctionSpecPolyType type) {
        logger.trace("Visiting FunctionSpecPolyType.");
        type.getArguments().forEach(argument -> argument.accept(this));
        type.getReturnType().accept(this);
    }

    default void visit(VariablePolyType type) {
        logger.trace("Visiting VariablePolyType.");
        type.getValueType().accept(this);
    }

    default void visit(FunctionPolyType type) {
        logger.trace("Visiting FunctionPolyType.");
        type.getSpec().accept(this);
    }

    default void visit(PropertyPolyType type) {
        logger.trace("Visiting PropertyPolyType.");
        type.getType().accept(this);
    }


    default void visit(PrimitivePolyType type) {
        logger.trace("Visiting PrimitivePolyType.");
        visit((PolyType) type);
    }
}
