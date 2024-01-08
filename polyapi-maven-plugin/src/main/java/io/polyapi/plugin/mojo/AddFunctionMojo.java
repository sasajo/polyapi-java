package io.polyapi.plugin.mojo;

import io.polyapi.commons.api.http.HttpClient;
import io.polyapi.commons.api.http.TokenProvider;
import io.polyapi.commons.api.json.JsonParser;
import io.polyapi.plugin.model.function.PolyFunction;
import io.polyapi.plugin.model.function.PolyFunctionArgument;
import io.polyapi.plugin.service.JavaParserService;
import io.polyapi.plugin.service.JavaParserServiceImpl;
import io.polyapi.plugin.service.MavenService;
import io.polyapi.plugin.service.PolyFunctionService;
import io.polyapi.plugin.service.PolyFunctionServiceImpl;
import lombok.Setter;
import org.apache.maven.plugins.annotations.Parameter;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.File;

import static java.util.stream.Collectors.joining;

@Setter
public abstract class AddFunctionMojo extends PolyApiMojo {
    private static final Logger logger = LoggerFactory.getLogger(AddFunctionMojo.class);

    @Parameter(property = "functionName", required = true)
    private String functionName;

    @Parameter(property = "file", required = true)
    private File file;

    @Parameter(property = "context")
    private String context;

    @Parameter(property = "description")
    private String description;

    public void execute(String host, Integer port, TokenProvider tokenProvider, HttpClient httpClient, JsonParser jsonParser, MavenService mavenService) {
        var classLoader = mavenService.getProjectClassLoader();
        logger.debug("Setting up the Java parser service.");
        logger.debug("Setting up class loader for all relevant places in the project.");
        JavaParserService javaParserService = new JavaParserServiceImpl(classLoader, jsonParser);
        logger.debug("Setting up HTTP service to access the Function API in Poly.");
        var functionApiService = new PolyFunctionServiceImpl(host, port, httpClient, jsonParser);
        logger.info("Parsing function {} in file {}.", functionName, file.getAbsolutePath());
        var polyFunction = javaParserService.parseFunction(mavenService.getSourceFolders(), mavenService.getJarSources(), file, functionName, description, context);
        logger.info("Poly function {}({}) parsed.", polyFunction.getName(), polyFunction.getArguments().stream().map(PolyFunctionArgument::getType).collect(joining(", ")));
        logger.info("Deploying function.");
        logger.debug("Target URL is {}.", host);
        deployFunction(polyFunction, functionApiService);
        logger.info("Function deployed successfully.");
    }

    protected abstract void deployFunction(PolyFunction function, PolyFunctionService polyFunctionService);
}
