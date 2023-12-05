package io.polyapi.client.maven.mojo;

import com.github.javaparser.ast.type.Type;
import io.polyapi.client.TypeData;
import io.polyapi.client.internal.parse.JsonParser;
import io.polyapi.client.error.classloader.QualifiedNameNotFoundException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.stream.Stream;

import static java.lang.String.format;

public class DataTypeResolver {
  private static final Logger logger = LoggerFactory.getLogger(DataTypeResolver.class);
  private final JsonParser jsonParser;
  private final ClassLoader classLoader;

  public DataTypeResolver(ClassLoader classLoader, JsonParser jsonParser) {
    this.classLoader = classLoader;
    this.jsonParser = jsonParser;
  }

  public TypeData resolve(Type type) {
    logger.debug("Resolving type of method declaration.");
    TypeData result = new TypeData("void", null);
    if (!type.isVoidType()) {
      String qualifiedName = (type.isArrayType() ? type.getElementType().resolve() : type.resolve()).asReferenceType().getQualifiedName();
      logger.trace("Qualified name for type is {}.", qualifiedName);
      try {
        logger.trace("Loading class for qualified name.");
        Class<?> clazz = classLoader.loadClass(qualifiedName);
        logger.trace("Class found: {}.", clazz.getName());
        logger.trace("Parsing loaded class to TypeData class.");
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
    logger.debug("Type resolved to {}.", result.name());
    return result;
  }
}
