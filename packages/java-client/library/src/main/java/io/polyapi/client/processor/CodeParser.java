package io.polyapi.client.processor;

import java.io.File;
import java.net.URL;
import java.net.URLClassLoader;
import java.util.ArrayList;
import java.util.List;

import io.polyapi.client.TypeData;
import io.polyapi.client.TypeResolver;
import org.apache.maven.project.MavenProject;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.github.javaparser.JavaParser;
import com.github.javaparser.ParserConfiguration;
import com.github.javaparser.ast.CompilationUnit;
import com.github.javaparser.ast.Modifier;
import com.github.javaparser.ast.NodeList;
import com.github.javaparser.ast.body.ClassOrInterfaceDeclaration;
import com.github.javaparser.ast.body.MethodDeclaration;
import com.github.javaparser.ast.body.Parameter;
import com.github.javaparser.ast.stmt.BlockStmt;
import com.github.javaparser.ast.type.Type;
import com.github.javaparser.symbolsolver.JavaSymbolSolver;
import com.github.javaparser.symbolsolver.resolution.typesolvers.ClassLoaderTypeSolver;
import com.github.javaparser.symbolsolver.resolution.typesolvers.CombinedTypeSolver;
import com.github.javaparser.symbolsolver.resolution.typesolvers.JarTypeSolver;
import com.github.javaparser.symbolsolver.resolution.typesolvers.JavaParserTypeSolver;
import com.github.javaparser.symbolsolver.resolution.typesolvers.ReflectionTypeSolver;
import com.kjetland.jackson.jsonSchema.JsonSchemaGenerator;

public class CodeParser {

  public List<FunctionData> parseFunctionData(MavenProject project, String name, File file) throws QualifiedNameNotFoundException {
    try {
      var functions = new ArrayList<FunctionData>();
      var classpathElements = new ArrayList<>(project.getCompileClasspathElements());
      classpathElements.addAll(project.getRuntimeClasspathElements());
      classpathElements.add(project.getBuild().getOutputDirectory());

      var urls = new URL[classpathElements.size()];
      for (int i = 0; i < classpathElements.size(); i++) {
        urls[i] = new File(classpathElements.get(i)).toURI().toURL();
      }

      var classLoader = new URLClassLoader(urls, getClass().getClassLoader());

      var combinedTypeSolver = new CombinedTypeSolver();
      project.getCompileSourceRoots()
        .forEach(path -> combinedTypeSolver.add(new JavaParserTypeSolver(new File(path))));
      combinedTypeSolver.add(new JavaParserTypeSolver(project.getBasedir() + "/target/generated-sources"));
      project.getCompileClasspathElements().stream()
        .filter(path -> path.endsWith(".jar"))
        .forEach(path -> {
          try {
            combinedTypeSolver.add(new JarTypeSolver(path));
          } catch (Exception e) {
            throw new RuntimeException(e);
          }
        });
      combinedTypeSolver.add(new ReflectionTypeSolver());
      combinedTypeSolver.add(new ClassLoaderTypeSolver(classLoader));

      var symbolSolver = new JavaSymbolSolver(combinedTypeSolver);
      var parser = new JavaParser(new ParserConfiguration().setSymbolResolver(symbolSolver));
      var compilationUnit = parser.parse(file).getResult().get();

      for (MethodDeclaration md : compilationUnit.findAll(MethodDeclaration.class)) {
        if (md.getNameAsString().equals(name)) {
          var functionData = new FunctionData();
          var typeData = resolveTypeData(md.getType(), classLoader);

          functionData.setName(md.getNameAsString());
          functionData.setReturnType(typeData.name());
          functionData.setReturnTypeSchema(typeData.jsonSchema());

          for (Parameter param : md.getParameters()) {
            var argumentData = new ArgumentData();
            var argumentTypeData = resolveTypeData(param.getType(), classLoader);

            argumentData.setName(param.getNameAsString());
            argumentData.setType(argumentTypeData.name());
            argumentData.setTypeSchema(argumentTypeData.jsonSchema());

            functionData.getArguments().add(argumentData);
          }

          var generatedCode = new CompilationUnit();
          var customFunctionClass = new ClassOrInterfaceDeclaration();

          generatedCode.addImport("io.polyapi.client.api.*");

          customFunctionClass.setName("PolyCustomFunction");
          var executeMethod = customFunctionClass.addMethod("execute");
          executeMethod.setType(Object.class);
          md.getParameters()
            .forEach(param -> {
              executeMethod.addParameter("Object", param.getNameAsString());
            });



          var body = new StringBuilder();

          body.append("{\n");
          body.append("  try {\n");
          body.append("    return executeInternal(\n");

          var parameters = md.getParameters();
          for (int index = 0, parametersSize = parameters.size(); index < parametersSize; index++) {
            var param = parameters.get(index);
            body.append("      ObjectMapper.getInstance().convertValue(").append(param.getNameAsString()).append(", ").append(param.getTypeAsString()).append(".class)");
            if (index < parametersSize - 1) {
              body.append(",\n");
            } else {
              body.append("\n");
            }
          }
          body.append("    );\n");
          body.append("  } catch (Exception e) {\n");
          body.append("    throw new PolyRuntimeException(e);\n");
          body.append("  }\n");
          body.append("}");

          executeMethod.setBody(parser.parseBlock(body.toString()).getResult().get());


          generatedCode.addType(customFunctionClass);

          md.accept(new TypeResolver(compilationUnit, parser), generatedCode);

          compilationUnit.getImports().stream()
            .filter(importDeclaration ->
              generatedCode.getTypes().stream()
                .noneMatch(typeDeclaration -> {
                  var type = typeDeclaration.asClassOrInterfaceDeclaration();
                  return importDeclaration.getNameAsString().endsWith(type.getNameAsString());
                })
            )
            .forEach(generatedCode::addImport);

          var executeInternal = generatedCode.getType(0).asClassOrInterfaceDeclaration().addMethod("executeInternal", Modifier.Keyword.PRIVATE)
            .setType(md.getType())
            .setBody(md.getBody().orElse(new BlockStmt(NodeList.nodeList())));
          md.getParameters()
            .forEach(param -> {
              executeInternal.addParameter(param.getType(), param.getNameAsString());
            });
          functionData.setCode(generatedCode.toString());

          functions.add(functionData);
        }
      }
      return functions;
    } catch (Exception e) {
      throw new QualifiedNameNotFoundException(e.getMessage(), e);
    }
  }

  private TypeData resolveTypeData(Type type, ClassLoader classLoader) throws JsonProcessingException, QualifiedNameNotFoundException {
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
      throw new QualifiedNameNotFoundException("Class not found: " + qualifiedName + ". Make sure you have compiled your project.", e);
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

    var objectMapper = new ObjectMapper();
    var jsonSchemaGenerator = new JsonSchemaGenerator(objectMapper);
    var jsonSchema = jsonSchemaGenerator.generateJsonSchema(clazz);

    return new TypeData("object", wrapInArrayConditionally(objectMapper.writeValueAsString(jsonSchema), isArray));
  }

  private String wrapInArrayConditionally(String schema, boolean wrap) {
    return wrap ? "{\"type\": \"array\", \"items\": " + schema + "}" : schema;
  }
}
