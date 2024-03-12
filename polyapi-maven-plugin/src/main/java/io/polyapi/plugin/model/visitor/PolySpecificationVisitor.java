package io.polyapi.plugin.model.visitor;

import io.polyapi.plugin.model.specification.Specification;
import io.polyapi.plugin.model.specification.function.*;
import io.polyapi.plugin.model.specification.variable.ServerVariableSpecification;
import io.polyapi.plugin.model.specification.webhook.WebhookHandleSpecification;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;


public interface PolySpecificationVisitor {
    Logger logger = LoggerFactory.getLogger(PolySpecificationVisitor.class);

    default void doVisit(Specification specification) {
        specification.accept(this);
    }
    default void visit(Specification specification) {
        logger.trace("Visiting Specification.");
        // Do nothing.
    }

    default void visit(FunctionSpecification specification) {
        logger.trace("Visiting FunctionSpecification.");
        visit((Specification) specification);
    }

    default void visit(ServerFunctionSpecification specification) {
        logger.trace("Visiting ServerFunctionSpecification.");
        visit((FunctionSpecification) specification);
    }

    default void visit(CustomFunctionSpecification specification) {
        logger.trace("Visiting CustomFunctionSpecification.");
        visit((FunctionSpecification) specification);
    }

    default void visit(ApiFunctionSpecification specification) {
        logger.trace("Visiting ApiFunctionSpecification.");
        visit((FunctionSpecification) specification);
    }

    default void visit(AuthFunctionSpecification specification) {
        logger.trace("Visiting AuthFunctionSpecification.");
        visit((FunctionSpecification) specification);
    }

    default void visit(ServerVariableSpecification specification) {
        logger.trace("Visiting ServerVariableSpecification.");
        visit((Specification) specification);
    }

    default void visit(WebhookHandleSpecification specification) {
        logger.trace("Visiting WebhookHandleSpecification.");
        visit((Specification) specification);
    }
}
