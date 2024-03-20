package io.polyapi.plugin.mojo;

import io.polyapi.plugin.model.function.PolyFunction;
import io.polyapi.plugin.service.PolyFunctionService;
import org.apache.maven.plugins.annotations.Mojo;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import static org.apache.maven.plugins.annotations.ResolutionScope.COMPILE_PLUS_RUNTIME;

@Mojo(name = "add-client-function", requiresDependencyResolution = COMPILE_PLUS_RUNTIME)
public class AddClientFunctionMojo extends AddFunctionMojo {

    private static final Logger log = LoggerFactory.getLogger(AddClientFunctionMojo.class);

    @Override
    protected void deployFunction(PolyFunction function, PolyFunctionService polyFunctionService) {
        log.info("Deploying client function...");
        var response = polyFunctionService.postClientFunction(function);
        log.info("Function deployed successfully: " + response.getName());
    }
}
