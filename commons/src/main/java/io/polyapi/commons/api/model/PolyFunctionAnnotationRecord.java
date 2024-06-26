package io.polyapi.commons.api.model;

import java.lang.reflect.Method;
import java.util.Optional;

public record PolyFunctionAnnotationRecord(String name, String context, String contextAwareness, boolean deployFunction,
                                           String type) {

    public static PolyFunctionAnnotationRecord of(PolyServerFunction annotation) {
        return new PolyFunctionAnnotationRecord(annotation.name(), annotation.context(), annotation.contextAwareness(), annotation.deployFunction(), "server");
    }

    public static PolyFunctionAnnotationRecord of(PolyClientFunction annotation) {
        return new PolyFunctionAnnotationRecord(annotation.name(), annotation.context(), annotation.contextAwareness(), annotation.deployFunction(), "client");
    }

    public static PolyFunctionAnnotationRecord createFrom(Method method) {
        return Optional.ofNullable(method.getAnnotation(PolyServerFunction.class))
                .map(PolyFunctionAnnotationRecord::of)
                .orElseGet(() -> Optional.ofNullable(method.getAnnotation(PolyClientFunction.class))
                        .map(PolyFunctionAnnotationRecord::of)
                        .orElse(null));
    }
}
