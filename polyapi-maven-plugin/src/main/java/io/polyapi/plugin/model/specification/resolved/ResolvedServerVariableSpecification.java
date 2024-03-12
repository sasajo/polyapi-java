package io.polyapi.plugin.model.specification.resolved;

import lombok.Getter;

import java.util.Set;

@Getter
public class ResolvedServerVariableSpecification extends ResolvedSpecification {
    private final String valueType;
    private final Boolean secret;

    public ResolvedServerVariableSpecification(String id, String name, String packageName, Set<String> imports, String className, String valueType, Boolean secret) {
        super(id, name, packageName, imports, className);
        this.valueType = valueType;
        this.secret = secret;
    }
}
