package io.polyapi.plugin.mojo;

import io.polyapi.plugin.model.function.PolyFunction;
import io.polyapi.plugin.service.DeploymentService;
import io.polyapi.plugin.service.DeploymentServiceImpl;
import lombok.Setter;
import lombok.extern.slf4j.Slf4j;
import org.apache.maven.plugins.annotations.Mojo;
import org.apache.maven.plugins.annotations.Parameter;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static com.google.common.base.Predicates.equalTo;
import static java.lang.String.join;
import static java.util.function.Predicate.not;
import static org.apache.maven.plugins.annotations.ResolutionScope.COMPILE_PLUS_RUNTIME;

@Slf4j
@Setter
@Mojo(name = "deploy-functions", requiresDependencyResolution = COMPILE_PLUS_RUNTIME)
public class DeployFunctionsMojo extends PolyApiMojo {

    @Parameter(property = "functions")
    private String functions;

    @Parameter(property = "dry-run", defaultValue = "false")
    private boolean dryRun;

    @Override
    protected void execute(String host, Integer port) {
        log.info("Initiating deployment of Poly functions.");
        DeploymentService polyFunctionService = new DeploymentServiceImpl(getHttpClient(), getJsonParser(), getMavenService(), host, port);
        List<String> functionFilters = Arrays.stream(Optional.ofNullable(functions).orElse("").split(","))
                .map(String::trim)
                .filter(not(equalTo("")))
                .toList();
        log.debug("Function filters: \"{}\"", join("\", \"", functionFilters));
        if (dryRun) {
            log.warn("Dry run mode is set. This won't deploy to server.");
        }
        List<PolyFunction> deployedFunctions = polyFunctionService.deployFunctions(functionFilters, dryRun);
        log.info("Deployed {} functions:", deployedFunctions.size());
        deployedFunctions.forEach(deployedFunction -> {
            log.info("    - Deployed function '{}' on context '{}' with id '{}'", deployedFunction.getSignature(), deployedFunction.getContext(), deployedFunction.getId());
        });
        log.info("Poly functions deployment complete.");
    }
}
