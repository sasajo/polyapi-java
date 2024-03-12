package io.polyapi.plugin.model.specification.resolved;

@FunctionalInterface
public interface ResolvedSpecificationConstructor<T extends ResolvedSpecification> {

    T create(ResolvedSpecification resolvedSpecification);
}
