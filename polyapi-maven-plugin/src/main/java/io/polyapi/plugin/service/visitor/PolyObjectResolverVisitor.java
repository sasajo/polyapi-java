package io.polyapi.plugin.service.visitor;

import io.polyapi.plugin.model.specification.Specification;
import io.polyapi.plugin.model.specification.function.ApiFunctionSpecification;
import io.polyapi.plugin.model.specification.function.AuthFunctionSpecification;
import io.polyapi.plugin.model.specification.function.CustomFunctionSpecification;
import io.polyapi.plugin.model.specification.function.ServerFunctionSpecification;
import io.polyapi.plugin.model.specification.resolved.ResolvedSpecification;
import io.polyapi.plugin.model.specification.variable.ServerVariableSpecification;
import io.polyapi.plugin.model.specification.webhook.WebhookHandleSpecification;
import io.polyapi.plugin.model.visitor.PolySpecificationVisitor;
import io.polyapi.plugin.service.generation.PolyObjectResolverService;
import lombok.Getter;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class PolyObjectResolverVisitor implements PolySpecificationVisitor {
    private static final Logger logger = LoggerFactory.getLogger(PolyObjectResolverVisitor.class);

    private final PolyObjectResolverService resolver;

    @Getter
    private ResolvedSpecification result;

    public PolyObjectResolverVisitor(PolyObjectResolverService resolver) {
        this.resolver = resolver;
    }

    @Override
    public void doVisit(Specification specification) {
        logger.debug("Resolving {} specification '{}' on context '{}'.", specification.getType(), specification.getName(), specification.getContext());
        PolySpecificationVisitor.super.doVisit(specification);
        logger.debug("{} specification '{}' on context '{}' resolved.", specification.getType(), specification.getName(), specification.getContext());
    }

    @Override
    public void visit(ServerFunctionSpecification specification) {
        logger.trace("Resolving ServerFunctionSpecification.");
        result = resolver.resolve(specification);
    }

    @Override
    public void visit(CustomFunctionSpecification specification) {
        logger.trace("Resolving CustomFunctionSpecification.");
        result = resolver.resolve(specification);
    }

    @Override
    public void visit(ApiFunctionSpecification specification) {
        logger.trace("Resolving ApiFunctionSpecification.");
        result = resolver.resolve(specification);
    }

    @Override
    public void visit(AuthFunctionSpecification specification) {
        logger.trace("Resolving AuthFunctionSpecification.");
        result = resolver.resolve(specification);
    }

    @Override
    public void visit(ServerVariableSpecification specification) {
        logger.trace("Resolving ServerVariableSpecification.");
        result = resolver.resolve(specification);
    }

    @Override
    public void visit(WebhookHandleSpecification specification) {
        logger.trace("Resolving WebhookHandleSpecification.");
        result = resolver.resolve(specification);
    }
}
