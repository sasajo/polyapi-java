package io.polyapi.client.maven.mojo;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.github.javaparser.JavaParser;
import com.github.javaparser.ParserConfiguration;
import com.github.javaparser.ast.CompilationUnit;
import com.github.javaparser.ast.Modifier;
import com.github.javaparser.ast.NodeList;
import com.github.javaparser.ast.body.ClassOrInterfaceDeclaration;
import com.github.javaparser.ast.body.MethodDeclaration;
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
import org.apache.maven.plugins.annotations.Mojo;
import org.apache.maven.plugins.annotations.Parameter;
import org.apache.maven.plugins.annotations.ResolutionScope;
import org.apache.maven.project.MavenProject;

import java.io.File;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.net.MalformedURLException;
import java.net.URL;
import java.net.URLClassLoader;
import java.util.ArrayList;
import java.util.HashMap;
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
@Mojo(name = "addFunction", requiresDependencyResolution = ResolutionScope.COMPILE_PLUS_RUNTIME)
public class AddFunctionMojo extends AbstractMojo {

  private final JsonParser jsonParser = new JacksonJsonParser(new ObjectMapper());

  @Parameter(defaultValue = "${project}", readonly = true)
  private MavenProject project;

  @Parameter(property = "name", required = true)
  private String name;

  @Parameter(property = "file", required = true)
  private File file;

  @Parameter(property = "apiBaseUrl")
  private String apiBaseUrl;

  @Parameter(property = "apiKey")
  private String apiKey;

  @Parameter(property = "context")
  private String context;

  @Parameter(property = "description")
  private String description;

  @Parameter(property = "client")
  private Boolean client;

  @Parameter(property = "server")
  private Boolean server;


  public void execute() throws MojoExecutionException {
    MavenService extractor = new MavenService(project);
    FunctionApiService functionApiService = new FunctionApiServiceImpl(apiBaseUrl,
      80,
      new DefaultHttpClient(new OkHttpClient.Builder()
        .connectTimeout(10, MINUTES)
        .readTimeout(10, MINUTES)
        .writeTimeout(10, MINUTES)
        .build(),
        new HardcodedTokenProvider(apiKey)),
      jsonParser);

    // Parsing the maven configuration to extract apiBaseUrl and apiKey from it.
    apiBaseUrl = Optional.ofNullable(apiBaseUrl).orElseGet(() -> extractor.getPropertyFromPlugin("apiBaseUrl"));
    apiKey = Optional.ofNullable(apiKey).orElseGet(() -> extractor.getPropertyFromPlugin("apiKey"));

    validateNotEmpty("apiBaseUrl", apiBaseUrl);
    validateNotEmpty("apiKey", apiKey);
    validateFileExistence("file", file);
    try {

      // Create a Classloader with all the elements in the project.
      var classLoader = new URLClassLoader(concat(concat(project.getCompileClasspathElements().stream(),
            project.getRuntimeClasspathElements().stream()),
          Stream.of(project.getBuild().getOutputDirectory()))
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
        .toArray(URL[]::new), getClass().getClassLoader());

      DataTypeResolver dataTypeResolver = new DataTypeResolver(classLoader, jsonParser);
      var combinedTypeSolver = new CombinedTypeSolver();
      project.getCompileSourceRoots().stream()
        .map(File::new)
        .map(JavaParserTypeSolver::new)
        .forEach(combinedTypeSolver::add);
      combinedTypeSolver.add(new JavaParserTypeSolver(project.getBasedir() + "/target/generated-sources"));
      project.getCompileClasspathElements().stream()
        .filter(path -> path.endsWith(".jar"))
        .forEach(path -> {
          try {
            combinedTypeSolver.add(new JarTypeSolver(path));
          } catch (IOException e) {
            // FIXME Throw an appropriate exception.
            throw new RuntimeException(e);
          }
        });
      combinedTypeSolver.add(new ReflectionTypeSolver());
      combinedTypeSolver.add(new ClassLoaderTypeSolver(classLoader));

      var parser = new JavaParser(new ParserConfiguration().setSymbolResolver(new JavaSymbolSolver(combinedTypeSolver)));
      var compilationUnit = parser.parse(file).getResult().get();

      var functions = new ArrayList<PolyFunction>();
      compilationUnit.findAll(MethodDeclaration.class).stream()
        .filter(methodDeclaration -> methodDeclaration.getNameAsString().equals(name))
        .forEach(methodDeclaration -> {
          var function = new PolyFunction();
          function.setDescription(description);
          function.setContext(context);
          var typeData = dataTypeResolver.resolve(methodDeclaration.getType());
          function.setName(methodDeclaration.getNameAsString());
          function.setReturnType(typeData.name());
          function.setReturnTypeSchema(jsonParser.parseString(typeData.jsonSchema(), defaultInstance().constructMapType(HashMap.class, String.class, Object.class)));
          methodDeclaration.getParameters().stream()
            .map(param -> {
              var argument = new PolyFunctionArgument();
              argument.setName(param.getNameAsString());
              var argumentTypeData = dataTypeResolver.resolve(param.getType());
              argument.setType(argumentTypeData.name());
              argument.setTypeSchema(argumentTypeData.jsonSchema());
              return argument;
            })
            .forEach(function.getArguments()::add);

          var generatedCode = new CompilationUnit();
          generatedCode.addImport("io.polyapi.client.api.*");

          var customFunctionClass = new ClassOrInterfaceDeclaration();
          customFunctionClass.setName("PolyCustomFunction");
          var executeMethod = customFunctionClass.addMethod("execute");
          executeMethod.setType(Object.class);
          methodDeclaration.getParameters()
            .stream().map(com.github.javaparser.ast.body.Parameter::getNameAsString)
            .forEach(param -> executeMethod.addParameter(Object.class, param));

          // TODO: Use a template generator tool for this.
          String body = "{\n" +
            "  try {\n" +
            "    return executeInternal(\n" +
            methodDeclaration.getParameters().stream()
              .map(param -> format("      ObjectMapper.getInstance().convertValue(%s\", \"%s.class)", param.getNameAsString(), param.getTypeAsString()))
              .collect(Collectors.joining(",\n", "", "\n")) +
            "    );\n" +
            "  } catch (Exception e) {\n" +
            "    throw new PolyRuntimeException(e);\n" +
            "  }\n" +
            "}";
          executeMethod.setBody(parser.parseBlock(body).getResult().get());
          generatedCode.addType(customFunctionClass);
          methodDeclaration.accept(new TypeResolver(compilationUnit, parser), generatedCode);
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

      var function = functions.get(0);
      if (client) {
        getLog().info("Deploying client function...");
        var response = functionApiService.postCustomClientFunction(function);
        getLog().info("Function deployed successfully: " + response.getId());
      }
      if (server) {
        getLog().info("Deploying server function...");
        var response = functionApiService.postCustomServerFunction(function);
        getLog().info("Function deployed successfully: " + response.getId());
      }
    } catch (DependencyResolutionRequiredException | FileNotFoundException e) {
      throw new MojoExecutionException("Error parsing file", e);
    } catch (PolyApiClientException e) {
      throw new MojoExecutionException(e);
    }
  }
}
