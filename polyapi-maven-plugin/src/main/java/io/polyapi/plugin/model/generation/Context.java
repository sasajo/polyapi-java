package io.polyapi.plugin.model.generation;

import io.polyapi.plugin.model.specification.Specification;
import io.polyapi.plugin.model.visitor.GenerableVisitor;
import lombok.Getter;
import lombok.Setter;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.*;

import static io.polyapi.plugin.utils.StringUtils.toPascalCase;
import static java.lang.String.format;
import static java.util.function.Predicate.isEqual;

@Getter
@Setter
public class Context {
    private static final Logger log = LoggerFactory.getLogger(Context.class);
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
