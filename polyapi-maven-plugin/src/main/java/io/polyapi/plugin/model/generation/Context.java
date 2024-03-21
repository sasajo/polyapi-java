package io.polyapi.plugin.model.generation;

import io.polyapi.plugin.model.specification.Specification;
import lombok.Getter;
import lombok.Setter;
import lombok.extern.slf4j.Slf4j;

import java.util.*;

import static io.polyapi.plugin.utils.StringUtils.toPascalCase;
import static java.lang.String.format;
import static java.util.function.Predicate.isEqual;

@Getter
@Setter
@Slf4j
public class Context {
    private String name;
    private Context parent;
    private List<Context> subcontexts = new ArrayList<>();
    private Set<Specification> specifications = new HashSet<>();

    public Context(Context parent, String name) {
        this.parent = parent;
        this.name = name;
    }

    public String getPackageName() {
        return Optional.ofNullable(parent).map(parent -> format("%s.context.%s", parent.getPackageName(), parent.getName().toLowerCase())).orElse("io.polyapi");
    }

    public String getClassName() {
        return toPascalCase(name);
    }

    public Context put(Context context) {
        return subcontexts.stream()
                .filter(isEqual(context))
                .findAny()
                .orElseGet(() -> {
                    subcontexts.add(context);
                    return context;
                });
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Context that)) return false;
        return name.equals(that.name);
    }

    @Override
    public int hashCode() {
        return Objects.hash(name);
    }
}
