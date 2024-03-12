package io.polyapi.plugin.model.specification.resolved;

import io.polyapi.plugin.model.generation.Generable;
import io.polyapi.plugin.model.generation.KeyValuePair;
import lombok.Getter;

import java.util.*;
import java.util.stream.Stream;

import static java.lang.String.format;
import static java.util.stream.Collectors.joining;

@Getter
public class ResolvedSpecification implements Generable {
    private final String id;
    private final String name;
    private final String packageName;
    private final Set<String> imports;
    private final String className;

    public ResolvedSpecification(ResolvedSpecification base) {
        this(base.id,
                base.name,
                base.packageName,
                base.imports,
                base.className);
    }

    public ResolvedSpecification(String id, String name, String packageName, Set<String> imports, String className) {
        this.id = id;
        this.name = name;
        this.packageName = packageName;
        this.imports = new HashSet<>();
        Optional.ofNullable(imports).ifPresent(this.imports::addAll);
        this.className = className;
    }
}
