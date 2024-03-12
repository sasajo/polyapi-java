package io.polyapi.plugin.model.specification.resolved;

import lombok.Getter;

@Getter
public class ResolvedCustomFunctionSpecification extends ResolvedDefaultFunctionSpecification {
    private final String delegate;

    public ResolvedCustomFunctionSpecification(ResolvedFunctionSpecification base, String delegate) {
        super(base);
        this.delegate = delegate;
    }
}
