package io.polyapi.plugin.mojo;

import com.github.javaparser.JavaParser;
import com.github.javaparser.ParserConfiguration;
import com.github.javaparser.ast.CompilationUnit;
import com.github.javaparser.ast.Modifier;
import com.github.javaparser.ast.NodeList;
import com.github.javaparser.ast.body.ClassOrInterfaceDeclaration;
import com.github.javaparser.ast.body.MethodDeclaration;
import com.github.javaparser.ast.body.TypeDeclaration;
import com.github.javaparser.ast.stmt.BlockStmt;
import com.github.javaparser.symbolsolver.JavaSymbolSolver;
import com.github.javaparser.symbolsolver.resolution.typesolvers.ClassLoaderTypeSolver;
import com.github.javaparser.symbolsolver.resolution.typesolvers.CombinedTypeSolver;
import com.github.javaparser.symbolsolver.resolution.typesolvers.JarTypeSolver;
import com.github.javaparser.symbolsolver.resolution.typesolvers.JavaParserTypeSolver;
import com.github.javaparser.symbolsolver.resolution.typesolvers.ReflectionTypeSolver;
import io.polyapi.commons.api.http.HttpClient;
import io.polyapi.commons.api.http.TokenProvider;
import io.polyapi.commons.api.json.JsonParser;
import io.polyapi.commons.api.model.function.PolyFunction;
import io.polyapi.commons.api.model.function.PolyFunctionArgument;
import io.polyapi.plugin.error.PolyApiMavenPluginException;
import io.polyapi.plugin.service.PolyFunctionService;
import io.polyapi.plugin.service.PolyFunctionServiceImpl;
import io.polyapi.plugin.service.JavaParserService;
import io.polyapi.plugin.service.JavaParserServiceImpl;
import io.polyapi.plugin.service.MavenService;
import io.polyapi.plugin.service.TypeResolver;
import lombok.Setter;
import org.apache.maven.plugins.annotations.Parameter;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.File;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import static com.fasterxml.jackson.databind.type.TypeFactory.defaultInstance;
import static java.lang.String.format;

@Setter
public abstract class AddFunctionMojo extends PolyApiMojo {
  private static final Logger logger = LoggerFactory.getLogger(AddFunctionMojo.class);

  @Parameter(property = "functionName", required = true)
  private String functionName;

  @Parameter(property = "file", required = true)
  private File file;

  @Parameter(property = "context")
  private String context;

  @Parameter(property = "description")
  private String description;

  public void execute(String host, Integer port, TokenProvider tokenProvider, HttpClient httpClient, JsonParser jsonParser, MavenService mavenService) {
    try {
      var classLoader = mavenService.getProjectClassLoader();
      logger.debug("Setting up the Java parser service.");
      logger.debug("Setting up class loader for all relevant places in the project.");
      JavaParserService javaParserService = new JavaParserServiceImpl(classLoader, jsonParser);
      logger.debug("Setting up HTTP service to access the Function API in Poly.");
      var functionApiService = new PolyFunctionServiceImpl(host, port, httpClient, jsonParser);

      logger.debug("Setting up a combined type solvers.");
      var combinedTypeSolver = new CombinedTypeSolver();
      mavenService.getSourceFolders().stream()
        .peek(sourceRoot -> logger.debug("    Adding JavaParserTypeSolver."))
        .map(JavaParserTypeSolver::new)
        .forEach(combinedTypeSolver::add);
      mavenService.getJarSources().stream()
        .peek(path -> logger.debug("    Adding JarTypeSolver."))
        .map(path -> {
          try {
            return new JarTypeSolver(path);
          } catch (IOException e) {
            // FIXME Throw an appropriate exception.
            throw new PolyApiMavenPluginException(e);
          }
        })
        .forEach(combinedTypeSolver::add);
      logger.debug("    Adding ReflectionTypeSolver.");
      combinedTypeSolver.add(new ReflectionTypeSolver());
      logger.debug("    Adding ClassLoaderTypeSolver for classloader defined above.");
      combinedTypeSolver.add(new ClassLoaderTypeSolver(classLoader));
      logger.debug("CombinedTypeSolver complete.");
      logger.debug("Setting up Java Parser.");
      var parser = new JavaParser(new ParserConfiguration().setSymbolResolver(new JavaSymbolSolver(combinedTypeSolver)));
      logger.debug("Parser complete.");
      logger.info("Proceeding with parsing of file in path '{}'.", file.getAbsolutePath());
      var compilationUnit = parser.parse(file).getResult().get();
      var functions = new ArrayList<PolyFunction>();
      compilationUnit.findAll(MethodDeclaration.class).stream()
        .filter(methodDeclaration -> methodDeclaration.getNameAsString().equals(functionName))
        .peek(methodDeclaration -> logger.debug("Found matching method declaration: {}", methodDeclaration.getDeclarationAsString()))
        .forEach(methodDeclaration -> {
          logger.debug("Creating PolyFunction from method declaration: {}", methodDeclaration.getNameAsString());
          var function = new PolyFunction();
          function.setDescription(description);
          function.setContext(context);
          function.setArguments(new ArrayList<>());
          logger.trace("Parsing return type for {}.", methodDeclaration.getNameAsString());
          var typeData = javaParserService.parse(methodDeclaration.getType());
          function.setName(methodDeclaration.getNameAsString());
          function.setReturnType(typeData.name());
          logger.trace("Adding JSon schema to return type.");
          function.setReturnTypeSchema(jsonParser.parseString(typeData.jsonSchema(), defaultInstance().constructMapType(HashMap.class, String.class, Object.class)));
          logger.trace("Parsing parameters.");
          Optional.<List<com.github.javaparser.ast.body.Parameter>>ofNullable(methodDeclaration.getParameters()).orElseGet(ArrayList::new).stream()
            .peek(param -> logger.trace("    Parsing parameter {}.", param.getName()))
            .map(param -> {
              logger.trace("Converting to PolyFunctionArgument.");
              var argument = new PolyFunctionArgument();
              argument.setName(param.getNameAsString());
              var argumentTypeData = javaParserService.parse(param.getType());
              argument.setType(argumentTypeData.name());
              argument.setTypeSchema(argumentTypeData.jsonSchema());
              return argument;
            })
            .forEach(function.getArguments()::add);
          logger.trace("Parsed {} parameters.", function.getArguments().size());

          logger.trace("Generating a CompilationUnit.");
          var generatedCode = new CompilationUnit();
          generatedCode.addImport("io.polyapi.client.api.*");
          var customFunctionClass = new ClassOrInterfaceDeclaration();
          customFunctionClass.setName("PolyCustomFunction");
          var executeMethod = customFunctionClass.addMethod("execute")
            .setType(Object.class);
          methodDeclaration.getParameters()
            .stream()
            .peek(parameter -> parameter.setType(Object.class))
            .forEach(executeMethod::addParameter);
          String body = "{\n" +
            "  try {\n" +
            "    return executeInternal(\n" +
            methodDeclaration.getParameters().stream()
              .map(param -> format("      ObjectMapper.getInstance().convertValue(\"%s\", %s.class)", param.getNameAsString(), param.getTypeAsString()))
              .collect(Collectors.joining(",\n", "", "\n")) +
            "    );\n" +
            "  } catch (Exception e) {\n" +
            "    throw new PolyRuntimeException(e);\n" +
            "  }\n" +
            "}";
          logger.trace("Setting body for function to:\n{}", body);

          // TODO: Use a template generator tool for this.
          parser.parseBlock(body)
            .getResult()
            .ifPresent(executeMethod::setBody);
          generatedCode.addType(customFunctionClass);
          methodDeclaration.accept(new TypeResolver(compilationUnit, parser), generatedCode);
          compilationUnit.getImports().stream()
            .filter(importDeclaration ->
              generatedCode.getTypes().stream()
                .map(TypeDeclaration::asClassOrInterfaceDeclaration)
                .map(ClassOrInterfaceDeclaration::getNameAsString)
                .noneMatch(importDeclaration.getNameAsString()::endsWith))
            .forEach(generatedCode::addImport);
          var executeInternal = generatedCode.getType(0).asClassOrInterfaceDeclaration().addMethod("executeInternal", Modifier.Keyword.PRIVATE)
            .setType(methodDeclaration.getType())
            .setBody(methodDeclaration.getBody().orElse(new BlockStmt(NodeList.nodeList())));
          methodDeclaration.getParameters()
            .forEach(param -> executeInternal.addParameter(param.getType(), param.getNameAsString()));
          function.setCode(generatedCode.toString());
          functions.add(function);
        });
      if (functions.isEmpty()) {
        throw new PolyApiMavenPluginException("No function with name " + functionName + " found in file: " + file.getAbsolutePath());
      } else if (functions.size() > 1) {
        throw new PolyApiMavenPluginException("More than one function with name " + functionName + " found in file: " + file.getAbsolutePath());
      }
      deployFunction(functions.get(0), functionApiService);
    } catch (FileNotFoundException e) {
      throw new PolyApiMavenPluginException("Error parsing file", e);
    }
  }

  protected abstract void deployFunction(PolyFunction function, PolyFunctionService polyFunctionService);
}
