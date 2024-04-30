package io.polyapi.plugin.model.specification.resolved;

import java.util.HashSet;
import java.util.Optional;
import java.util.Set;

import io.polyapi.plugin.model.generation.Generable;
import lombok.Getter;

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
