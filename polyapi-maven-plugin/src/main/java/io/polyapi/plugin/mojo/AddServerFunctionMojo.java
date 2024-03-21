package io.polyapi.plugin.mojo;

import io.polyapi.plugin.model.function.PolyFunction;
import io.polyapi.plugin.service.PolyFunctionService;
import lombok.extern.slf4j.Slf4j;
import org.apache.maven.plugins.annotations.Mojo;

import static org.apache.maven.plugins.annotations.ResolutionScope.COMPILE_PLUS_RUNTIME;

@Mojo(name = "add-server-function", requiresDependencyResolution = COMPILE_PLUS_RUNTIME)
@Slf4j
public class AddServerFunctionMojo extends AddFunctionMojo {

    @Override
    protected void deployFunction(PolyFunction function, PolyFunctionService polyFunctionService) {
        log.info("Deploying server function...");
        var response = polyFunctionService.postServerFunction(function);
        log.info("Function deployed successfully: " + response.getName());
    }
}
