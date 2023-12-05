package io.polyapi.client.maven.mojo;

import com.fasterxml.jackson.databind.ObjectMapper;
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
import io.polyapi.client.TypeResolver;
import io.polyapi.client.error.PolyApiClientException;
import io.polyapi.client.internal.http.DefaultHttpClient;
import io.polyapi.client.internal.http.HardcodedTokenProvider;
import io.polyapi.client.internal.parse.JacksonJsonParser;
import io.polyapi.client.internal.parse.JsonParser;
import io.polyapi.client.internal.service.FunctionApiService;
import io.polyapi.client.internal.service.FunctionApiServiceImpl;
import io.polyapi.client.model.function.PolyFunction;
import io.polyapi.client.model.function.PolyFunctionArgument;
import lombok.Setter;
import okhttp3.OkHttpClient;
import org.apache.maven.artifact.DependencyResolutionRequiredException;
import org.apache.maven.plugin.AbstractMojo;
import org.apache.maven.plugin.MojoExecutionException;
import org.apache.maven.plugins.annotations.Parameter;
import org.apache.maven.project.MavenProject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.File;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.net.MalformedURLException;
import java.net.URL;
import java.net.URLClassLoader;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import static com.fasterxml.jackson.databind.type.TypeFactory.defaultInstance;
import static io.polyapi.client.maven.mojo.validation.Validator.validateFileExistence;
import static io.polyapi.client.maven.mojo.validation.Validator.validateNotEmpty;
import static java.lang.String.format;
import static java.util.concurrent.TimeUnit.MINUTES;
import static java.util.stream.Stream.concat;

@Setter
public abstract class AddFunctionMojo extends AbstractMojo {
  private static final Logger logger = LoggerFactory.getLogger(AddFunctionMojo.class);

  private final JsonParser jsonParser = new JacksonJsonParser(new ObjectMapper());

  @Parameter(defaultValue = "${project}", readonly = true)
  private MavenProject project;

  @Parameter(property = "function.name", required = true)
  private String name;

  @Parameter(property = "file", required = true)
  private File file;

  @Parameter(property = "polyapi.host")
  private String host;

  @Parameter(property = "polyapi.port", defaultValue = "80")
  private String port;

  @Parameter(property = "polyapi.api.key")
  private String apiKey;

  @Parameter(property = "polyapi.function.context")
  private String context;

  @Parameter(property = "polyapi.function.description")
  private String description;

  public void execute() throws MojoExecutionException {
    logger.debug("Setting up Maven service.");
    MavenService extractor = new MavenService(project);
    logger.debug("Setting up HTTP service to access the Function API in Poly.");
    FunctionApiService functionApiService = new FunctionApiServiceImpl(host,
      Integer.valueOf(port),
      new DefaultHttpClient(new OkHttpClient.Builder()
        .connectTimeout(10, MINUTES)
        .readTimeout(10, MINUTES)
        .writeTimeout(10, MINUTES)
        .build(),
        new HardcodedTokenProvider(apiKey)),
      jsonParser);

    // Parsing the maven configuration to extract apiBaseUrl and apiKey from it.
    logger.debug("Retrieving property 'apiBaseUrl'.");
    extractor.getPropertyFromPlugin("apiBaseUrl", host, this::setHost);
    validateNotEmpty("apiBaseUrl", host);

    logger.debug("Retrieving property 'apiKey'.");
    extractor.getPropertyFromPlugin("apiKey", apiKey, this::setApiKey);
    validateNotEmpty("apiKey", apiKey);

    logger.debug("Validating existence of file in path {}}.", file.getAbsolutePath());
    validateFileExistence("file", file);
    logger.debug("File present.");
    try {

      // Create a Classloader with all the elements in the project.
      logger.debug("Setting up class loader for all relevant places in the project.");
      var classLoader = new URLClassLoader(concat(concat(project.getCompileClasspathElements().stream(),
          project.getRuntimeClasspathElements().stream()),
        Stream.of(project.getBuild().getOutputDirectory()))
        .peek(classLoadingPath -> logger.debug("    Adding classloading path '{}'.", classLoadingPath))
        .map(File::new)
        .map(File::toURI)
        .map(uri -> {
          try {
            return uri.toURL();
          } catch (MalformedURLException e) {
            // FIXME: Throw appropriate exception.
            throw new RuntimeException(e);
          }
        })
        .toArray(URL[]::new),
        getClass().getClassLoader());

      logger.debug("Setting up a combined type type solvers.");
      var combinedTypeSolver = new CombinedTypeSolver();
      Stream.concat(project.getCompileSourceRoots().stream(), Stream.of(project.getBasedir() + "/target/generated-sources"))
        .peek(sourceRoot -> logger.debug("    Adding JavaParserTypeSolver for source root '{}'", sourceRoot))
        .map(File::new)
        .map(JavaParserTypeSolver::new)
        .forEach(combinedTypeSolver::add);
      project.getCompileClasspathElements().stream()
        .filter(path -> path.endsWith(".jar"))
        .peek(path -> logger.debug("    Adding JarTypeSolver for path '{}'.", path))
        .map(path -> {
          try {
            return new JarTypeSolver(path);
          } catch (IOException e) {
            // FIXME Throw an appropriate exception.
            throw new RuntimeException(e);
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
      DataTypeResolver dataTypeResolver = new DataTypeResolver(classLoader, jsonParser);
      var compilationUnit = parser.parse(file).getResult().get();
      var functions = new ArrayList<PolyFunction>();
      compilationUnit.findAll(MethodDeclaration.class).stream()
        .filter(methodDeclaration -> methodDeclaration.getNameAsString().equals(name))
        .peek(methodDeclaration -> logger.debug("Found matching method declaration: {}", methodDeclaration.getDeclarationAsString()))
        .forEach(methodDeclaration -> {
          logger.debug("Creating PolyFunction from method declaration: {}", methodDeclaration.getNameAsString());
          var function = new PolyFunction();
          function.setDescription(description);
          function.setContext(context);
          function.setArguments(new ArrayList<>());
          logger.trace("Parsing return type for {}.", methodDeclaration.getNameAsString());
          var typeData = dataTypeResolver.resolve(methodDeclaration.getType());
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
              var argumentTypeData = dataTypeResolver.resolve(param.getType());
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

          // TODO: Use a template generator tool for this.
          parser.parseBlock("{\n" +
              "  try {\n" +
              "    return executeInternal(\n" +
              methodDeclaration.getParameters().stream()
                .map(param -> format("      ObjectMapper.getInstance().convertValue(%s\", \"%s.class)", param.getNameAsString(), param.getTypeAsString()))
                .collect(Collectors.joining(",\n", "", "\n")) +
              "    );\n" +
              "  } catch (Exception e) {\n" +
              "    throw new PolyRuntimeException(e);\n" +
              "  }\n" +
              "}")
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
        throw new MojoExecutionException("No function with name " + name + " found in file: " + file.getAbsolutePath());
      } else if (functions.size() > 1) {
        throw new MojoExecutionException("More than one function with name " + name + " found in file: " + file.getAbsolutePath());
      }
      deployFunction(functions.get(0), functionApiService);
    } catch (DependencyResolutionRequiredException | FileNotFoundException e) {
      logger.error("Error parsing file.", e);
      throw new MojoExecutionException("Error parsing file", e);
    } catch (PolyApiClientException e) {
      logger.error("Poly API client error.", e);
      throw new MojoExecutionException(e);
    } catch (RuntimeException e) {
      logger.error("Unexpected error.", e);
      throw new MojoExecutionException(e);
    }
  }

  protected abstract void deployFunction(PolyFunction function, FunctionApiService functionApiService);
}
