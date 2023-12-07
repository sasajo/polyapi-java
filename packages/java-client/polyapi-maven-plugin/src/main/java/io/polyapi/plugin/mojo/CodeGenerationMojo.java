package io.polyapi.plugin.mojo;


import io.polyapi.commons.api.error.PolyApiException;
import io.polyapi.commons.internal.http.HardcodedTokenProvider;
import io.polyapi.plugin.mojo.validation.Validator;
import io.polyapi.plugin.service.generator.CodeGenerator;
import lombok.Setter;
import org.apache.maven.plugin.AbstractMojo;
import org.apache.maven.plugin.MojoExecutionException;
import org.apache.maven.plugins.annotations.Mojo;
import org.apache.maven.plugins.annotations.Parameter;

@Mojo(name = "generate-sources")
@Setter
public class CodeGenerationMojo extends AbstractMojo {
  @Parameter(property = "host", required = true)
  private String host;

  @Parameter(property = "polyapi.port", defaultValue = "80")
  private String port;

  @Parameter(property = "polyapi.api.key", required = true)
  private String apiKey;

  public void execute() throws MojoExecutionException {
    try {
      Validator.validateNotEmpty("host", host);
      Validator.validateNotEmpty("apiKey", apiKey);
      Validator.validateNotEmpty("port", port);
      new CodeGenerator(host, Integer.valueOf(port), new HardcodedTokenProvider(apiKey)).generate();
    } catch (PolyApiException e) {
      throw new MojoExecutionException(e);
    }
  }
}
