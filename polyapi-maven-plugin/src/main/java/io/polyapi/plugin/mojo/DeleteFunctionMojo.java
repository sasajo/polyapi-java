package io.polyapi.plugin.mojo;

import io.polyapi.plugin.error.validation.BadExclusionException;
import io.polyapi.plugin.service.PolyFunctionService;
import io.polyapi.plugin.service.PolyFunctionServiceImpl;
import lombok.Setter;
import lombok.extern.slf4j.Slf4j;
import org.apache.maven.plugins.annotations.Mojo;
import org.apache.maven.plugins.annotations.Parameter;

import java.util.Optional;

import static io.polyapi.plugin.mojo.validation.Validator.validateNotEmpty;
import static io.polyapi.plugin.mojo.validation.Validator.validateUUIDFormat;
import static org.apache.commons.lang.StringUtils.isNotBlank;

@Slf4j
@Setter
@Mojo(name = "delete-function", requiresProject = false)
public class DeleteFunctionMojo extends PolyApiMojo {
    @Parameter(property = "functionName")
    private String functionName;

    @Parameter(property = "context")
    private String context;

    @Parameter(property = "id")
    private String id;


    @Override
    protected void execute(String host, Integer port) {
        log.info("Initiating deletion of Poly function.");
        PolyFunctionService service = new PolyFunctionServiceImpl(getHttpClient(), getJsonParser(), host, port);
        Optional.ofNullable(id)
                .ifPresentOrElse(functionId -> {
                            if (isNotBlank(functionName)) {
                                throw new BadExclusionException("id", "functionName");
                            }
                            if (isNotBlank(context)) {
                                throw new BadExclusionException("id", "context");
                            }
                            validateUUIDFormat("id", functionId);
                            service.delete(functionId);
                        },
                        () -> {
                            validateNotEmpty("functionName", functionName);
                            validateNotEmpty("context", context);
                            service.delete(context, functionName);
                        });
        log.info("Poly function deletion complete.");
    }
}
