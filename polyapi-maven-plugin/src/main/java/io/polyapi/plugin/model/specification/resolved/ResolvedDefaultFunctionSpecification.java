package io.polyapi.plugin.model.specification.resolved;

import io.polyapi.plugin.model.generation.KeyValuePair;
import io.polyapi.plugin.utils.StringUtils;
import lombok.Getter;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Stream;

import static java.lang.String.format;
import static java.util.function.Predicate.isEqual;
import static java.util.function.Predicate.not;
import static java.util.stream.Collectors.joining;

public class ResolvedDefaultFunctionSpecification extends ResolvedFunctionSpecification {

    public ResolvedDefaultFunctionSpecification(ResolvedFunctionSpecification base) {
        super(base);
    }

    public ResolvedDefaultFunctionSpecification(String id, String name, String packageName, Set<String> imports, String className, String methodName, List<KeyValuePair<String, String>> arguments, String returnType) {
        super(id, name, packageName, imports, className, methodName, arguments, returnType);
    }
}
