package io.polyapi.client;


import io.polyapi.client.generator.CodeGenerator;
import org.apache.maven.plugin.AbstractMojo;
import org.apache.maven.plugin.MojoExecutionException;
import org.apache.maven.plugins.annotations.Mojo;
import org.apache.maven.plugins.annotations.Parameter;

import java.io.IOException;

@Mojo(name = "generate-sources")
public class CodeGenerationMojo extends AbstractMojo {
  @Parameter(property = "polyapi.apiBaseUrl", required = true)
  private String apiBaseUrl;

  @Parameter(property = "polyapi.apiKey", required = true)
  private String apiKey;

  public void execute() throws MojoExecutionException {
    try {
      if (apiBaseUrl == null || apiBaseUrl.isEmpty() || apiKey == null || apiKey.isEmpty()) {
        throw new MojoExecutionException("Both polyapi.apiBaseUrl and polyapi.apiKey properties must be set in the pom.xml");
      }
      new CodeGenerator().generate(apiBaseUrl, apiKey);
    } catch (IOException e) {
      throw new MojoExecutionException(e.getMessage(), e);
    }
  }
}
