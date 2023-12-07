package io.polyapi.plugin.service.generator;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.github.jknack.handlebars.Handlebars;
import io.polyapi.commons.api.error.PolyApiException;
import io.polyapi.commons.api.file.FileService;
import io.polyapi.plugin.model.LibraryTreeNode;
import io.polyapi.plugin.model.property.ObjectPropertyType;
import io.polyapi.plugin.model.specification.Specification;

import java.io.File;
import java.io.IOException;
import java.util.Arrays;
import java.util.Optional;

import static java.lang.String.format;

abstract class SpecificationClassGenerator<T extends Specification> extends AbstractClassGenerator {

  private final JsonSchemaToTypeGenerator jsonSchemaToTypeGenerator = new JsonSchemaToTypeGenerator();

  public SpecificationClassGenerator(Handlebars handlebars, FileService fileService) {
    super(handlebars, fileService);
  }

  static boolean isArray(JsonNode schema) {
    return schema.get("type").textValue().equals("array");
  }

  protected void insertIntoTree(LibraryTreeNode<T> currentNode, T spec) {
    var contextParts = spec.getContext().split("\\.");
    for (int i = 0; i < contextParts.length; i++) {
      var subContext = contextParts[i];

      if (!subContext.isEmpty()) {
        // If this part of the context already exists as a subcontext, traverse deeper
        if (currentNode.getSubContexts().containsKey(subContext)) {
          currentNode = currentNode.getSubContext(subContext);
        } else {
          // If this context part doesn't exist yet, create a new node and traverse deeper
          var newNode = new LibraryTreeNode<T>(subContext);
          currentNode.addSubContext(subContext, newNode);
          currentNode = newNode;
        }
      }

      // If we're at the last part of the context, add the specification to the node
      if (i == contextParts.length - 1) {
        currentNode.addSpecification(spec);
      }
    }
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
        if (!directory.mkdirs()) {
          // FIXME: Throw the appropriate exception.
          throw new PolyApiException(format("Parent file not created of file %s.", Optional.of(directory)
            .map(File::getParentFile)
            .map(File::getAbsolutePath)
            .orElse("null")));
        }
        codeModel.build(directory);
      } catch (IOException e) {
        // FIXME: This should either throw the IOException or the appropriate RuntimeException.
        throw new RuntimeException(e);
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
      if (schema.get("type").textValue().equals("object")) {
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
}
