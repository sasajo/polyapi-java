package io.polyapi.plugin.model.specification;

import io.polyapi.plugin.model.Generable;
import io.polyapi.plugin.service.visitor.CodeGenerationVisitor;
import lombok.Getter;
import lombok.Setter;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.stream.Stream;

import static java.lang.String.format;
import static java.util.function.Predicate.isEqual;
import static java.util.stream.Stream.concat;

@Getter
@Setter
public class Context implements Generable {
    private static final Logger logger = LoggerFactory.getLogger(Context.class);
    private String name;
    private Context parent;
    private List<Context> subcontexts = new ArrayList<>();
    private List<Specification> specifications = new ArrayList<>();

    public Context(Context parent, String name) {
        this.parent = parent;
        this.name = name;
    }

    @Override
    public String getPackageName() {
        return Optional.ofNullable(parent).map(parent -> format("%s.context.%s", parent.getPackageName(), parent.getName().toLowerCase())).orElse("io.polyapi");
    }

    @Override
    public void accept(CodeGenerationVisitor visitor) {
        visitor.visit(this);
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
