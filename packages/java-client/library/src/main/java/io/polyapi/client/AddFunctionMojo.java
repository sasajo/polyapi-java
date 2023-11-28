package io.polyapi.client;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.polyapi.client.processor.CodeParser;
import io.polyapi.client.processor.FunctionData;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;
import okhttp3.MediaType;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.RequestBody;
import okhttp3.Response;
import org.apache.maven.plugin.AbstractMojo;
import org.apache.maven.plugin.MojoExecutionException;
import org.apache.maven.plugins.annotations.Mojo;
import org.apache.maven.plugins.annotations.Parameter;
import org.apache.maven.plugins.annotations.ResolutionScope;
import org.apache.maven.project.MavenProject;
import org.codehaus.plexus.util.xml.Xpp3Dom;

import java.io.File;
import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.concurrent.TimeUnit;

@Mojo(name = "addFunction", requiresDependencyResolution = ResolutionScope.COMPILE_PLUS_RUNTIME)
public class AddFunctionMojo extends AbstractMojo {
  private ObjectMapper objectMapper = new ObjectMapper();
  @Parameter(defaultValue = "${project}", readonly = true)
  private MavenProject project;

  @Parameter(defaultValue = "${project.build.sourceDirectory}", readonly = true, required = true)
  private String sourceDirectory;

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
    if (apiBaseUrl == null || apiKey == null) {
      var apiData = new ApiData();

      try {
        project.getBuild().getPlugins().stream()
          .filter(plugin -> "io.polyapi.client".equals(plugin.getGroupId()))
          .filter(plugin -> "library".equals(plugin.getArtifactId()))
          .findFirst()
          .ifPresent(plugin -> {
            Xpp3Dom configuration = Xpp3Dom.class.cast(plugin.getConfiguration());
            if (configuration == null && !plugin.getExecutions().isEmpty()) {
              configuration = Xpp3Dom.class.cast(plugin.getExecutions().get(0).getConfiguration());
            }

            if (configuration != null) {
              Optional.ofNullable(configuration.getChild("apiBaseUrl"))
                .filter(Objects::nonNull)
                .map(Xpp3Dom::getValue)
                .ifPresent(apiBaseUrlNode -> apiData.apiBaseUrl = apiBaseUrlNode);
              Optional.ofNullable(configuration.getChild("apiKey"))
                .filter(Objects::nonNull)
                .map(Xpp3Dom::getValue)
                .ifPresent(apiKeyNode -> apiData.apiKey = apiKeyNode);
            }
          });
      } catch (RuntimeException e) {
        throw new MojoExecutionException("Error building project", e);
      }
      apiBaseUrl = apiBaseUrl != null ? apiBaseUrl : apiData.apiBaseUrl;
      apiKey = apiKey != null ? apiKey : apiData.apiKey;
    }
    if (apiBaseUrl == null) {
      throw new MojoExecutionException("apiBaseUrl is required");
    }
    if (apiKey == null) {
      throw new MojoExecutionException("apiKey is required");
    }
    if (!file.exists()) {
      throw new MojoExecutionException("File does not exist: " + file.getAbsolutePath());
    }

    try {
      var codeParser = new CodeParser();
      var functionData = codeParser.parseFunctionData(project, name, file);

      if (functionData.isEmpty()) {
        throw new MojoExecutionException("No function with name " + name + " found in file: " + file.getAbsolutePath());
      } else if (functionData.size() > 1) {
        throw new MojoExecutionException("More than one function with name " + name + " found in file: " + file.getAbsolutePath());
      }

      var function = functionData.get(0);
      if (Boolean.TRUE.equals(client)) {
        getLog().info("Deploying client function...");
        var response = postCustomFunction(function, false);
        getLog().info("Function deployed successfully: " + response.getId());
      }
      if (Boolean.TRUE.equals(server)) {
        getLog().info("Deploying server function...");
        var response = postCustomFunction(function, true);
        getLog().info("Function deployed successfully: " + response.getId());
      }
    } catch (Exception e) {
      throw new MojoExecutionException("Error parsing file", e);
    }
  }

  private PostCustomFunctionResponse postCustomFunction(FunctionData function, boolean server) throws IOException, MojoExecutionException {
    var client = new OkHttpClient.Builder().connectTimeout(10, TimeUnit.MINUTES).readTimeout(10, TimeUnit.MINUTES).writeTimeout(10, TimeUnit.MINUTES).build();

    var bodyString = objectMapper.writeValueAsString(new PostCustomFunctionBody(function));
    var request = new Request.Builder().url(apiBaseUrl + "/functions/" + (server ? "server" : "client")).header("Authorization", "Bearer " + apiKey).post(RequestBody.create(bodyString, MediaType.parse("application/json; charset=utf-8"))).build();

    try (Response response = client.newCall(request).execute()) {
      if (!response.isSuccessful()) {
        throw new MojoExecutionException("Error while setting Poly specifications: " + response.code() + " " + response.message() + (response.body() != null ? response.body().string() : ""));
      }

      return objectMapper.readValue(response.body().string(), PostCustomFunctionResponse.class);
    }
  }

  private static class ApiData {
    private String apiBaseUrl;
    private String apiKey;
  }

  @Setter
  @Getter
  private static class PostCustomFunctionResponse {
    private String id;
  }

  @Getter
  private class PostCustomFunctionBody {
    private final String name;
    private final String description;
    private final String context;
    private final String code;
    private final String language = "java";
    private final String returnType;
    private final Map<String, Object> returnTypeSchema;
    private final List<FunctionArgument> arguments;

    public PostCustomFunctionBody(FunctionData function) throws JsonProcessingException {
      name = function.getName();
      code = function.getCode();
      description = AddFunctionMojo.this.description;
      context = AddFunctionMojo.this.context;
      returnType = function.getReturnType();

      var typeRef = new TypeReference<HashMap<String, Object>>() {
      };
      returnTypeSchema = objectMapper.readValue(function.getReturnTypeSchema(), typeRef);

      arguments = function.getArguments().stream()
        .map(argumentData -> FunctionArgument.builder()
          .key(argumentData.getName())
          .name(argumentData.getName())
          .type(argumentData.getType())
          .typeSchema(argumentData.getTypeSchema())
          .build())
        .toList();
    }
  }

  @Getter
  @Setter
  @Builder
  private static class FunctionArgument {
    private String key;
    private String name;
    private String type;
    private String typeSchema;
  }
}
