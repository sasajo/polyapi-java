package io.polyapi.plugin.model.visitor;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import io.polyapi.plugin.model.generation.CustomType;
import io.polyapi.plugin.model.generation.Generable;

public interface GenerableVisitor extends PolySpecificationVisitor {
    Logger log = LoggerFactory.getLogger(GenerableVisitor.class);

    default void visit(Generable generable) {
        log.trace("Visiting Generable.");
        // Do nothing.
    }

    default void visit(CustomType generable) {
        log.trace("Visiting CustomType.");
        visit((Generable) generable);
    }
}
