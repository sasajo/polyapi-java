package io.polyapi.plugin.mojo;

import io.polyapi.commons.api.error.http.UnexpectedHttpResponseException;
import io.polyapi.commons.api.http.HttpClient;
import io.polyapi.commons.api.http.TokenProvider;
import io.polyapi.commons.api.json.JsonParser;
import io.polyapi.commons.internal.http.DefaultHttpClient;
import io.polyapi.commons.internal.http.HardcodedTokenProvider;
import io.polyapi.commons.internal.json.JacksonJsonParser;
import io.polyapi.plugin.error.PolyApiMavenPluginException;
import io.polyapi.plugin.mojo.validation.Validator;
import io.polyapi.plugin.service.MavenService;
import lombok.Setter;
import okhttp3.OkHttpClient;
import org.apache.commons.io.IOUtils;
import org.apache.maven.plugin.AbstractMojo;
import org.apache.maven.plugin.MojoExecutionException;
import org.apache.maven.plugin.MojoFailureException;
import org.apache.maven.plugins.annotations.Parameter;
import org.apache.maven.project.MavenProject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.util.Optional;
import java.util.function.Consumer;

import static java.lang.String.format;
import static java.nio.charset.Charset.defaultCharset;
import static java.util.concurrent.TimeUnit.MINUTES;

@Setter
public abstract class PolyApiMojo extends AbstractMojo {
    private static final Logger logger = LoggerFactory.getLogger(PolyApiMojo.class);

    @Parameter(defaultValue = "${project}", readonly = true)
    private MavenProject project;

    @Parameter(property = "host")
    private String host;

    @Parameter(property = "port")
    private String port;

    @Parameter(property = "apiKey")
    private String apiKey;

    @Override
    public void execute() throws MojoExecutionException, MojoFailureException {
        try {
            logger.debug("Setting up Maven service.");
            MavenService mavenService = Optional.ofNullable(project).map(MavenService::new).orElse(null);
            logger.info(mavenService == null ? "No Maven project." : format("Maven service set. Targeting artifact %s.%s:%s.", project.getGroupId(), project.getArtifactId(), project.getVersion()));

            Optional.ofNullable(mavenService).ifPresent(getPropertyFromPlugin("host", host, this::setHost));
            Validator.validateNotEmpty("host", host);

            Optional.ofNullable(mavenService).ifPresent(getPropertyFromPlugin("port", port, this::setPort));
            Validator.validatePortFormat("port", port);

            Optional.ofNullable(mavenService).ifPresent(getPropertyFromPlugin("apiKey", apiKey, this::setApiKey));
            Validator.validateNotEmpty("apiKey", apiKey);
            TokenProvider tokenProvider = new HardcodedTokenProvider(apiKey);
            execute(host, Integer.valueOf(port), tokenProvider, new DefaultHttpClient(new OkHttpClient.Builder()
                            .connectTimeout(10, MINUTES)
                            .readTimeout(10, MINUTES)
                            .writeTimeout(10, MINUTES)
                            .build(),
                            tokenProvider),
                    new JacksonJsonParser(),
                    mavenService);
        } catch (PolyApiMavenPluginException e) {
            logger.error("An exception occurred during the plugin execution.", e);
            throw new MojoFailureException(e);
        } catch (UnexpectedHttpResponseException e) {
            logger.error("An unexpected HTTP response code {} was returned from the server.", e.getResponse().statusCode());
            //if (logger.isTraceEnabled()) {
                try {
                    logger.info("Response from server is: {}", IOUtils.toString(e.getResponse().body(), defaultCharset()));
                } catch (IOException ex) {
                    throw new MojoExecutionException(ex);
                }
            //}
            throw new MojoFailureException(e);
        } catch (RuntimeException e) {
            logger.error("An unexpected exception occurred during the plugin execution.", e);
            throw new MojoExecutionException(e);
        }
    }

    private Consumer<MavenService> getPropertyFromPlugin(String propertyName, String property, Consumer<String> callback) {
        logger.debug("Retrieving property 'port'.");
        return mavenService -> mavenService.getPropertyFromPlugin(propertyName, property, callback);
    }

    protected abstract void execute(String host, Integer port, TokenProvider tokenProvider, HttpClient httpClient, JsonParser jsonParser, MavenService mavenService);
}
