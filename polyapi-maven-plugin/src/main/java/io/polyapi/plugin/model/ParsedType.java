package io.polyapi.plugin.model;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.lang.reflect.ParameterizedType;
import java.lang.reflect.Type;
import java.util.*;
import java.util.stream.Stream;

import static java.lang.String.format;
import static java.util.function.Predicate.not;
import static java.util.stream.Collectors.joining;
import static java.util.stream.Collectors.toSet;

@Getter
@AllArgsConstructor
public class ParsedType {
    private final String baseClass;
    private final List<ParsedType> typeParameters;

    public ParsedType(String baseClass) {
        this(baseClass, new ArrayList<>());
    }

    public ParsedType(Type type) {
        if (type instanceof ParameterizedType parameterizedType) {
            this.baseClass = parameterizedType.getTypeName();
            this.typeParameters = Arrays.stream(parameterizedType.getActualTypeArguments()).map(ParsedType::new).toList();
        } else {
            this.baseClass = type.getTypeName();
            this.typeParameters = new ArrayList<>();
        }
    }

    public String getFullName() {
        return format("%s%s", baseClass, Optional.of(Optional.ofNullable(typeParameters).stream()
                        .flatMap(List::stream)
                        .map(ParsedType::getFullName)
                        .collect(joining(", ")))
                .filter(not(String::isBlank))
                .map(params -> format("<%s>", params)).orElse(""));
    }

    public String getName() {
        return format("%s%s", baseClass.substring(baseClass.lastIndexOf(".")), Optional.of(Optional.ofNullable(typeParameters).stream()
                        .flatMap(List::stream)
                        .map(ParsedType::getName)
                        .collect(joining(", ")))
                .filter(not(String::isBlank))
                .map(params -> format("<%s>", params)).orElse(""));
    }

    public Set<String> getTypes() {
        return Stream.concat(Stream.of(baseClass), Optional.ofNullable(typeParameters).stream()
                        .flatMap(List::stream)
                        .map(ParsedType::getTypes)
                        .flatMap(Set::stream))
                .collect(toSet());
    }
}
