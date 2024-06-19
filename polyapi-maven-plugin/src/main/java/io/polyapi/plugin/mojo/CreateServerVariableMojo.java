package io.polyapi.plugin.mojo;

import io.polyapi.plugin.model.ServerVariable;
import io.polyapi.plugin.service.ServerVariableService;
import io.polyapi.plugin.service.ServerVariableServiceImpl;
import lombok.Setter;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.math.NumberUtils;
import org.apache.maven.plugins.annotations.Mojo;
import org.apache.maven.plugins.annotations.Parameter;

import java.util.Optional;

import static java.lang.Boolean.FALSE;
import static java.lang.Boolean.TRUE;

@Slf4j
@Setter
@Mojo(name = "create-server-variable", requiresProject = false)
public class CreateServerVariableMojo extends PolyApiMojo {
    @Parameter(property = "name", required = true)
    private String name;

    @Parameter(property = "context", required = true)
    private String context;

    @Parameter(property = "description")
    private String description;

    @Parameter(property = "type")
    private String type;

    @Parameter(property = "value", required = true)
    private String value;

    @Parameter(property = "secret", defaultValue = "true")
    private boolean secret;

    @Override
    protected void execute(String host, Integer port) {
        log.info("Initiating creation of server variable.");
        ServerVariableService serverVariableService = new ServerVariableServiceImpl(getHttpClient(), getJsonParser(), host, port);
        Object usedValue = switch (Optional.ofNullable(type).orElse("").toLowerCase()) {
            case "string", "java.lang.string" -> value;
            case "byte", "java.lang.byte", "short", "java.lang.short", "integer", "java.lang.integer", "long", "java.lang.long" -> Long.valueOf(value);
            case "float", "java.lang.float", "double", "java.lang.double" -> Double.valueOf(value);
            case "boolean", "java.lang.boolean" -> Boolean.valueOf(value);
            default -> {
                if (value.equalsIgnoreCase(TRUE.toString()) || value.equalsIgnoreCase(FALSE.toString())) {
                    yield Boolean.valueOf(value);
                }
                if (NumberUtils.isParsable(value)) {
                    Double doubleValue = Double.valueOf(value);
                    if (doubleValue - doubleValue.longValue() == 0) {
                        yield doubleValue.longValue();
                    } else {
                        yield doubleValue;
                    }
                }
                yield value;
            }
        };
        log.debug("Used type '{}'", value.getClass().getName());
        ServerVariable serverVariable = serverVariableService.create(name, description, usedValue, secret, context);
        log.info("Server variable '{}' created with ID '{}'.", serverVariable.getName(), serverVariable.getId());
        log.info("Server variable creation complete.");
    }
}
