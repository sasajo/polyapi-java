package io.polyapi.plugin.model.visitor;

import io.polyapi.plugin.model.specification.Specification;
import io.polyapi.plugin.model.specification.function.*;
import io.polyapi.plugin.model.specification.variable.ServerVariableSpecification;
import io.polyapi.plugin.model.specification.webhook.WebhookHandleSpecification;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;


public interface PolySpecificationVisitor {
    Logger log = LoggerFactory.getLogger(PolySpecificationVisitor.class);

    default void doVisit(Specification specification) {
        specification.accept(this);
    }
    default void visit(Specification specification) {
        log.trace("Visiting Specification.");
        // Do nothing.
    }

    default void visit(FunctionSpecification specification) {
        log.trace("Visiting FunctionSpecification.");
        visit((Specification) specification);
    }

    default void visit(ServerFunctionSpecification specification) {
        log.trace("Visiting ServerFunctionSpecification.");
        visit((FunctionSpecification) specification);
    }

    default void visit(ClientFunctionSpecification specification) {
        log.trace("Visiting CustomFunctionSpecification.");
        visit((FunctionSpecification) specification);
    }

    default void visit(ApiFunctionSpecification specification) {
        log.trace("Visiting ApiFunctionSpecification.");
        visit((FunctionSpecification) specification);
    }

    default void visit(AuthFunctionSpecification specification) {
        log.trace("Visiting AuthFunctionSpecification.");
        visit((FunctionSpecification) specification);
    }

    default void visit(ServerVariableSpecification specification) {
        log.trace("Visiting ServerVariableSpecification.");
        visit((Specification) specification);
    }

    default void visit(WebhookHandleSpecification specification) {
        log.trace("Visiting WebhookHandleSpecification.");
        visit((Specification) specification);
    }
}
