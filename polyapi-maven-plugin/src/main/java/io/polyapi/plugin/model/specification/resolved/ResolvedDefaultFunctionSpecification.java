package io.polyapi.plugin.model.specification.resolved;

import java.util.List;
import java.util.Set;

import io.polyapi.plugin.model.generation.KeyValuePair;

public class ResolvedDefaultFunctionSpecification extends ResolvedFunctionSpecification {

    public ResolvedDefaultFunctionSpecification(ResolvedFunctionSpecification base) {
        super(base);
    }

    public ResolvedDefaultFunctionSpecification(String id, String name, String packageName, Set<String> imports, String className, String methodName, List<KeyValuePair<String, String>> arguments, String returnType) {
        super(id, name, packageName, imports, className, methodName, arguments, returnType);
    }
}
