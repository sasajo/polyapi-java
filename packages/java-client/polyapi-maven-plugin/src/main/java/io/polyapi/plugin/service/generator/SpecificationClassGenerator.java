package io.polyapi.plugin.service.generator;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.github.jknack.handlebars.Handlebars;
import io.polyapi.commons.api.service.file.FileService;
import io.polyapi.plugin.error.PolyApiMavenPluginException;
import io.polyapi.plugin.model.LibraryTreeNode;
import io.polyapi.plugin.model.property.ObjectPropertyType;
import io.polyapi.plugin.model.specification.Specification;

import java.io.File;
import java.io.IOException;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

abstract class SpecificationClassGenerator<T extends Specification> extends AbstractClassGenerator {

  private final JsonSchemaToTypeGenerator jsonSchemaToTypeGenerator = new JsonSchemaToTypeGenerator();

  public SpecificationClassGenerator(Handlebars handlebars, FileService fileService) {
    super(handlebars, fileService);
  }

  static boolean isArray(JsonNode schema) {
    return Optional.ofNullable(schema.get("type")).map(JsonNode::textValue).orElse("").equals("array");
  }

  protected void insertIntoTree(LibraryTreeNode<T> currentNode, List<String> contextList, T spec) {
    if (contextList.isEmpty()) {
      currentNode.addSpecification(spec);
    } else {
      insertIntoTree(currentNode.getOrPutNew(contextList.get(0)), contextList.subList(1, contextList.size()), spec);
    }
  }

  protected void insertIntoTree(T spec) {
    insertIntoTree(getRoot(), List.of(spec.getContext().split("\\.")), spec);
  }

  protected void generateObjectPropertyType(String packageName, ObjectPropertyType objectPropertyType, String defaultTypeName) {

    var typeName = Optional.ofNullable(objectPropertyType.getSchema())
      .map(schema -> findTypeName(schema, defaultTypeName))
      .orElse(defaultTypeName);
    var schema = normalizeObjectSchema(objectPropertyType.getSchema(), objectPropertyType.getSchema());

    if (schema != null) {
      var codeModel = jsonSchemaToTypeGenerator.generateObjectCodeModel(schema, typeName, packageName);
      try {
        var directory = new File("target/generated-sources/");
        directory.mkdirs();
        codeModel.build(directory);
      } catch (IOException e) {
        // FIXME: This should either throw the IOException or the appropriate RuntimeException.
        throw new PolyApiMavenPluginException(e);
      }
    } else {
      if (objectPropertyType.getProperties() != null) {
        var result = new StringBuilder();
        result.append("package ").append(packageName).append(";\n\n");
        result.append("@lombok.Getter\n");
        result.append("@lombok.Setter\n");
        result.append("public class ").append(typeName).append(" {\n");
        for (var property : objectPropertyType.getProperties()) {
          result.append("  public ").append(property.getType().getInCodeType()).append(" ").append(property.getInCodeName()).append(";\n");
        }
        result.append("}");
        getFileService().createClassFile(packageName, typeName, result.toString());
      } else {
        if (objectPropertyType.getSchema() == null) {
          return;
        }
      }
    }

    if (objectPropertyType.getSchema() != null) {
      if (SpecificationClassGenerator.isArray(objectPropertyType.getSchema())) {
        objectPropertyType.setTypeName(("java.util.List<" + typeName + ">").equals(defaultTypeName) ? packageName + "." + typeName : typeName + ">");
      }
    }
    objectPropertyType.setTypeName(typeName.equals(defaultTypeName) ? packageName + "." + typeName : typeName);
  }

  private String findTypeName(JsonNode schema, String defaultTypeName) {
    return Optional.ofNullable(schema.get("type"))
      .map(JsonNode::textValue)
      .map(type -> switch (type) {
        case "array" -> findTypeName(schema.get("items"), defaultTypeName);
        case "string" -> "String";
        case "number" -> "Double";
        case "integer" -> "Long";
        default -> defaultTypeName;
      })
      .orElse(defaultTypeName);
  }

  private JsonNode normalizeObjectSchema(JsonNode rootSchema, JsonNode schema) {
    JsonNode normalizedSchema = null;
    if (schema == null) {
      return null;
    }

    if (schema.get("$ref") != null) {
      var reference = schema.get("$ref").textValue();
      var parts = reference.split("/");
      var node = schema;
      if (parts.length == 0) {
        return null;
      }
      if (parts[0].equals("#")) {
        node = rootSchema;
        parts = Arrays.copyOfRange(parts, 1, parts.length);
      }
      var referencedSchema = getReferencedSchema(node, parts);
      normalizedSchema = normalizeObjectSchema(rootSchema, referencedSchema);
    } else {
      if (Optional.ofNullable(schema.get("type")).map(JsonNode::textValue).orElse("").equals("object")) {
        normalizedSchema = schema;
      } else {
        if (SpecificationClassGenerator.isArray(schema)) {
          normalizedSchema = normalizeObjectSchema(rootSchema, schema.get("items"));
        }
      }
    }

    if (normalizedSchema instanceof ObjectNode objectNode && rootSchema.get("definitions") != null) {
      normalizedSchema = objectNode.deepCopy();
      ((ObjectNode) normalizedSchema).set("definitions", rootSchema.get("definitions"));
    }

    return normalizedSchema;
  }

  private JsonNode getReferencedSchema(JsonNode node, String[] pathParts) {
    if (pathParts.length == 0) {
      return node;
    }
    return getReferencedSchema(node.get(pathParts[0]), Arrays.copyOfRange(pathParts, 1, pathParts.length));
  }

  protected abstract LibraryTreeNode<T> getRoot();
}
