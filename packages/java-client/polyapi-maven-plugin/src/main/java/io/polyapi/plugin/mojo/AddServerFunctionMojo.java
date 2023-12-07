package io.polyapi.plugin.mojo;

import io.polyapi.plugin.service.FunctionApiService;
import io.polyapi.commons.api.model.function.PolyFunction;
import org.apache.maven.plugins.annotations.Mojo;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import static org.apache.maven.plugins.annotations.ResolutionScope.COMPILE_PLUS_RUNTIME;

@Mojo(name = "addServerFunction", requiresDependencyResolution = COMPILE_PLUS_RUNTIME)
public class AddServerFunctionMojo extends AddFunctionMojo {

  private static final Logger logger = LoggerFactory.getLogger(AddClientFunctionMojo.class);

  @Override
  protected void deployFunction(PolyFunction function, FunctionApiService functionApiService) {
    logger.info("Deploying server function...");
    var response = functionApiService.postCustomServerFunction(function);
    logger.info("Function deployed successfully: " + response.getId());
  }
}
