package io.polyapi.client.maven.mojo;

import com.github.javaparser.ast.type.Type;
import io.polyapi.client.TypeData;
import io.polyapi.client.internal.parse.JsonParser;
import io.polyapi.client.error.classloader.QualifiedNameNotFoundException;

import java.util.stream.Stream;

import static java.lang.String.format;

public class DataTypeResolver {
  private final JsonParser jsonParser;
  private final ClassLoader classLoader;

  public DataTypeResolver(ClassLoader classLoader, JsonParser jsonParser) {
    this.classLoader = classLoader;
    this.jsonParser = jsonParser;
  }

  public TypeData resolve(Type type) {
    TypeData result = new TypeData("void", null);
    if (!type.isVoidType()) {
      String qualifiedName = (type.isArrayType() ? type.getElementType().resolve() : type.resolve()).asReferenceType().getQualifiedName();
      try {
        Class<?> clazz = classLoader.loadClass(qualifiedName);
        result = new TypeData("object", format(type.isArrayType() ? "{\"type\": \"array\", \"items\": %s}" : "%s", Stream.of(String.class, Integer.class, Number.class, Boolean.class)
          .filter(expectedClass -> expectedClass.isAssignableFrom(clazz))
          .findFirst()
          .map(Class::getSimpleName)
          .map(String::toLowerCase)
          .map(expectedClass -> format("{\"type\": \"%s\"}", expectedClass))
          .orElseGet(() -> jsonParser.toJsonSchema(clazz))));
      } catch (ClassNotFoundException e) {
        throw new QualifiedNameNotFoundException(qualifiedName, e);
      }
    }
    return result;
  }
}
