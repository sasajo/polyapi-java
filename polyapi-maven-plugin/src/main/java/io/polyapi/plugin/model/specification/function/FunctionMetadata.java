package io.polyapi.plugin.model.specification.function;

import io.polyapi.plugin.model.property.PropertyType;
import io.polyapi.plugin.model.property.VoidPropertyType;
import lombok.Getter;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import static java.lang.String.format;
import static java.util.function.Predicate.not;
import static java.util.stream.Collectors.toSet;
import static java.util.stream.IntStream.range;
import static java.util.stream.Stream.concat;

@Getter
@Setter
public class FunctionMetadata {
    private List<PropertyMetadata> arguments;
    private PropertyType returnType;
    private Boolean synchronous;

    public boolean getReturnsValue() {
        return Optional.ofNullable(returnType).filter(not(VoidPropertyType.class::isInstance)).isPresent();
    }

    public Set<String> getImports(String basePackage, String defaultType) {
        return concat(range(0, Optional.ofNullable(arguments).orElseGet(ArrayList::new).size())
                        .boxed()
                        .map(i -> arguments.get(i).getType().getImports(basePackage, format("%sArgument%s", defaultType, i)))
                        .flatMap(Set::stream),
                returnType.getImports(basePackage, defaultType + "Response").stream()).collect(toSet());
    }

    public String getResultType(String defaultValue) {
        return getReturnsValue() ? returnType.getType(defaultValue) : "void";
    }
}
