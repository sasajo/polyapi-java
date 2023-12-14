package io.polyapi.commons.api.model;

import java.lang.annotation.Retention;
import java.lang.annotation.Target;

import static java.lang.annotation.ElementType.TYPE;
import static java.lang.annotation.RetentionPolicy.RUNTIME;

@Target(TYPE)
@Retention(RUNTIME)
public @interface PolyMetadata {

  Class<?>[] paramTypes() default {};

  String[] paramNames() default {};
}
