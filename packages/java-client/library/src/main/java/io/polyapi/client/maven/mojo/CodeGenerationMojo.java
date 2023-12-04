package io.polyapi.client.maven.mojo;


import io.polyapi.client.error.PolyApiClientException;
import io.polyapi.client.generator.CodeGenerator;
import io.polyapi.client.internal.http.HardcodedTokenProvider;
import io.polyapi.client.maven.mojo.validation.Validator;
import lombok.Setter;
import org.apache.maven.plugin.AbstractMojo;
import org.apache.maven.plugin.MojoExecutionException;
import org.apache.maven.plugins.annotations.Mojo;
import org.apache.maven.plugins.annotations.Parameter;

import java.io.IOException;

import static io.polyapi.client.maven.mojo.validation.Validator.validateNotEmpty;

@Mojo(name = "generate-sources")
@Setter
public class CodeGenerationMojo extends AbstractMojo {
  @Parameter(property = "polyapi.apiBaseUrl", required = true)
  private String apiBaseUrl;

  @Parameter(property = "polyapi.port", defaultValue = "80")
  private String port;

  @Parameter(property = "polyapi.apiKey", required = true)
  private String apiKey;

  public void execute() throws MojoExecutionException {
    try {
      validateNotEmpty("apiBaseUrl", apiBaseUrl);
      validateNotEmpty("apiKey", apiKey);
      validateNotEmpty("port", port);
      new CodeGenerator(apiBaseUrl, Integer.valueOf(port), new HardcodedTokenProvider(apiKey)).generate();
    } catch (PolyApiClientException e) {
      throw new MojoExecutionException(e);
    }
  }
}
