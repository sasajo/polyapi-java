package io.polyapi.client.maven.mojo;

import com.github.javaparser.ast.type.Type;
import com.kjetland.jackson.jsonSchema.JsonSchemaGenerator;
import io.polyapi.client.TypeData;
import io.polyapi.client.internal.parse.JsonParser;
import io.polyapi.client.processor.QualifiedNameNotFoundException;

public class DataTypeResolver {
  private final JsonSchemaGenerator jsonSchemaGenerator;
  private JsonParser jsonParser;

  private final ClassLoader classLoader;

  public DataTypeResolver(ClassLoader classLoader, JsonParser jsonParser, JsonSchemaGenerator jsonSchemaGenerator) {
    this.classLoader = classLoader;
    this.jsonParser = jsonParser;
    this.jsonSchemaGenerator = jsonSchemaGenerator;
  }

  public TypeData resolve(Type type) {
    if (type.isVoidType()) {
      return new TypeData("void", null);
    }
    var isArray = type.isArrayType();
    var resolvedType = isArray ? type.getElementType().resolve() : type.resolve();
    var qualifiedName = resolvedType.asReferenceType().getQualifiedName();
    Class<?> clazz;
    try {
      clazz = classLoader.loadClass(qualifiedName);
    } catch (ClassNotFoundException e) {
      throw new QualifiedNameNotFoundException(qualifiedName, e);
    }

    if (String.class.isAssignableFrom(clazz)) {
      return new TypeData("object", wrapInArrayConditionally("{\"type\": \"string\"}", isArray));
    }
    if (Integer.class.isAssignableFrom(clazz)) {
      return new TypeData("object", wrapInArrayConditionally("{\"type\": \"integer\"}", isArray));
    }
    if (Number.class.isAssignableFrom(clazz)) {
      return new TypeData("object", wrapInArrayConditionally("{\"type\": \"number\"}", isArray));
    }
    if (Boolean.class.isAssignableFrom(clazz)) {
      return new TypeData("object", wrapInArrayConditionally("{\"type\": \"boolean\"}", isArray));
    }

    return new TypeData("object", wrapInArrayConditionally(jsonParser.toJsonString(jsonSchemaGenerator.generateJsonSchema(clazz)), isArray));
  }

  private String wrapInArrayConditionally(String schema, boolean wrap) {
    return wrap ? "{\"type\": \"array\", \"items\": " + schema + "}" : schema;
  }
}
