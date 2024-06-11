package io.polyapi.plugin.service;

import static java.lang.String.format;
import static java.util.function.Predicate.not;
import static java.util.regex.Pattern.compile;
import static java.util.stream.Collectors.joining;
import static java.util.stream.Collectors.toSet;
import static java.util.stream.Stream.concat;
import static javax.lang.model.SourceVersion.isKeyword;
import static org.reflections.scanners.Scanners.MethodsAnnotated;

import java.io.File;
import java.lang.reflect.Method;
import java.net.MalformedURLException;
import java.net.URL;
import java.net.URLClassLoader;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.function.Consumer;
import java.util.function.Predicate;
import java.util.regex.Pattern;
import java.util.stream.Stream;

import javax.lang.model.SourceVersion;

import org.apache.maven.artifact.DependencyResolutionRequiredException;
import org.apache.maven.model.Build;
import org.apache.maven.model.Plugin;
import org.apache.maven.model.PluginExecution;
import org.apache.maven.project.MavenProject;
import org.codehaus.plexus.util.xml.Xpp3Dom;
import org.reflections.Reflections;
import org.reflections.util.ConfigurationBuilder;

import io.polyapi.commons.api.model.PolyFunction;
import io.polyapi.commons.api.model.PolyGeneratedClass;
import io.polyapi.commons.api.model.RequiredDependencies;
import io.polyapi.commons.api.model.RequiredDependency;
import io.polyapi.plugin.error.PolyApiMavenPluginException;
import io.polyapi.plugin.error.validation.PropertyNotFoundException;
import lombok.extern.slf4j.Slf4j;

@Slf4j
public class MavenService {
    private static final String FUNCTION_NAME_PATTERN = "^[a-z][\\w$]*$";
    private static final String CONTEXT_PATTERN = "^[a-z][\\w$.]*[\\w$]$";
    private final MavenProject project;

    public MavenService(MavenProject project) {
        this.project = project;
    }

    public void getPropertyFromPlugin(String propertyName, String currentValue, Consumer<String> callback) {
        log.debug("Checking value of '{}' as an input parameter.", propertyName);
        if (currentValue == null) {
            log.debug("Parameter '{}' is empty. Attempting to retrieve it from plugin configuration.", propertyName);
            callback.andThen(value -> log.debug("Parameter '{}' value is '{}'.", propertyName, value))
                    .accept(getPropertyFromPlugin("io.polyapi.client", "library", propertyName));
        } else {
            log.debug("Parameter '{}' value is '{}'", propertyName, currentValue);
        }
    }

    public String getPropertyFromPlugin(String pluginGroupId, String pluginArtifactId, String propertyName) {
        log.debug("Scanning plugins.");
        List<Plugin> plugins = Optional.ofNullable(project).map(MavenProject::getBuild).map(Build::getPlugins).orElseGet(ArrayList::new);
        log.debug("Found {} plugins. Filtering by group ID matching '{}' and artifact ID matching '{}'.", plugins.size(), pluginGroupId, pluginArtifactId);
        return plugins.stream()
                .filter(plugin -> pluginGroupId.equals(plugin.getGroupId()))
                .filter(plugin -> pluginArtifactId.equals(plugin.getArtifactId()))
                .flatMap(plugin -> {
                    log.debug("Found match: {}.{}:{}.\nRetrieving executions.", plugin.getGroupId(), plugin.getArtifactId(), plugin.getVersion());
                    List<PluginExecution> executions = Optional.ofNullable(plugin.getExecutions()).orElseGet(ArrayList::new);
                    log.debug("Found {} executions.", executions.size());
                    return executions.stream();
                })
                .map(PluginExecution::getConfiguration)
                .filter(Objects::nonNull)
                .map(Xpp3Dom.class::cast)
                .flatMap(configuration -> {
                    log.debug("Found configuration within the execution. Retrieving children.");
                    Xpp3Dom[] children = Optional.ofNullable(configuration.getChildren()).orElse(new Xpp3Dom[]{});
                    log.debug("Found {} children properties.", children.length);
                    return Arrays.stream(children);
                })
                .map(Xpp3Dom::getValue)
                .findFirst()
                .orElseThrow(() -> new PropertyNotFoundException(propertyName));
    }

    public URLClassLoader getProjectClassLoader() {
        try {
            return new URLClassLoader(concat(concat(project.getCompileClasspathElements().stream(),
                            project.getRuntimeClasspathElements().stream()),
                    Stream.of(project.getBuild().getOutputDirectory()))
                    .map(File::new)
                    .map(File::toURI)
                    .map(uri -> {
                        try {
                            return uri.toURL();
                        } catch (MalformedURLException e) {
                            // FIXME: Throw appropriate exception.
                            throw new RuntimeException(e);
                        }
                    })
                    .toArray(URL[]::new),
                    MavenService.class.getClassLoader());
        } catch (DependencyResolutionRequiredException e) {
            throw new RuntimeException(e); // FIXME: Throw the appropriate exception.
        }
    }

    public List<File> getSourceFolders() {
        return concat(project.getCompileSourceRoots().stream(), Stream.of(project.getBasedir() + "/target/generated-sources"))
                .map(File::new)
                .filter(File::exists)
                .toList();
    }

    public List<String> getJarSources() {
        try {
            return project.getCompileClasspathElements().stream()
                    .filter(path -> path.endsWith(".jar"))
                    .toList();
        } catch (DependencyResolutionRequiredException e) {
            // FIXME: Throw appropriate exception.
            throw new PolyApiMavenPluginException(e);
        }
    }

    public Set<Method> scanPolyFunctions(Predicate<Method> filter) {
        log.info("Scanning the project for functions annotated with {}}.", PolyFunction.class.getName());
        URLClassLoader projectClassLoader = getProjectClassLoader();
        Reflections reflections = new Reflections(new ConfigurationBuilder()
                .addClassLoaders(projectClassLoader)
                .addScanners(MethodsAnnotated)
                .addUrls(projectClassLoader.getURLs()));
        log.debug("Reflections URLS: {}", reflections.getConfiguration().getUrls().size());
        Set<Method> methods = reflections.getMethodsAnnotatedWith(PolyFunction.class).stream()
                .filter(filter)
                .collect(toSet());
        log.info("Found {} methods to convert.", methods.size());
        List.of(RequiredDependency.class, RequiredDependencies.class).forEach(annotation ->
                reflections.getMethodsAnnotatedWith(annotation).stream()
                        .filter(not(methods::contains))
                        .forEach(misusedMethod -> log.warn("Method {} is annotated with {} but is ignored as it needs to be annotated with {} to be scanned.", misusedMethod, misusedMethod.getAnnotation(annotation).getClass().getSimpleName(), PolyFunction.class.getSimpleName())));
        Set<Method> validatedMethods = methods.stream()
                .filter(not(method -> method.getDeclaringClass().isAnnotationPresent(PolyGeneratedClass.class)))
                .filter(method -> {
                    boolean result = true;
                    PolyFunction polyFunction = method.getAnnotation(PolyFunction.class);
                    log.debug("Validating function name.");
                    String functionName = Optional.ofNullable(polyFunction.name()).filter(not(String::isBlank)).orElseGet(method::getName);
                    if (!functionName.matches(FUNCTION_NAME_PATTERN)) {
                        log.error("Method '{}' skipped. Property 'functionName' with value '{}' doesn't match pattern '{}'.", method, functionName, FUNCTION_NAME_PATTERN);
                        result = false;
                    }
                    if (isKeyword(functionName.trim())) {
                        log.error("Method '{}' skipped. Property 'functionName' with value '{}' is a Java keyword.", method, functionName);
                        result = false;
                    }
                    return result;
                })
                .filter(method -> {
                    boolean result = true;
                    PolyFunction polyFunction = method.getAnnotation(PolyFunction.class);
                    log.debug("Validating context.");
                    String context = Optional.ofNullable(polyFunction.context()).filter(not(String::isEmpty)).orElseGet(method.getDeclaringClass()::getPackageName);
                    if (!context.matches(CONTEXT_PATTERN)) {
                        log.error("Method '{}' skipped. Property 'context' with value '{}' doesn't match pattern '{}'.", method, context, CONTEXT_PATTERN);
                        result = false;
                    }
                    String keywords = Arrays.stream(context.split("\\.")).filter(SourceVersion::isKeyword).collect(joining(","));
                    if (!keywords.isEmpty()) {
                        log.error("Method '{}' skipped. Property 'context' with value '{}' uses Java keywords '{}}'. Please rename the context accordingly.", method, context, keywords);
                        result = false;
                    }
                    return result;
                })
                .filter(method -> {
                    PolyFunction polyFunction = method.getAnnotation(PolyFunction.class);
                    boolean isDeployable = polyFunction.deployFunction();
                    if (!isDeployable) {
                        log.warn("Method '{}' skipped. Marked as not deployable.", method);
                    }
                    return isDeployable;
                })
                .collect(toSet());
        if (validatedMethods.size() < methods.size()) {
            log.warn("Only {} of {} methods are valid.", validatedMethods.size(), methods.size());
        }
        return validatedMethods;
    }

    public List<String> getMatchingDependencies(List<String> patterns) {
        log.debug("Retrieving required dependencies.");
        Pattern pattern = compile(Optional.of(String.join("|", patterns))
                .filter(not(String::isEmpty))
                .orElse("(?=a)b"));
        log.debug("Pattern used to match required dependencies is: {}", pattern.pattern());
        List<String> requiredDependencies = project.getDependencies().stream()
                .map(dependency -> format("%s:%s:%s", dependency.getGroupId(), dependency.getArtifactId(), dependency.getVersion()))
                .filter(pattern.asPredicate())
                .toList();
        log.debug("Required dependencies found: {}", requiredDependencies);
        return requiredDependencies;
    }

    public Set<Method> getPolyFunctionMethods() {
        log.info("Scanning projects for methods annotated with @PolyFunction.");
        URLClassLoader projectClassLoader = getProjectClassLoader();
        Reflections reflections = new Reflections(new ConfigurationBuilder()
                .addClassLoaders(projectClassLoader)
                .addScanners(MethodsAnnotated)
                .addUrls(projectClassLoader.getURLs()));
        log.info("Reflections URLS: {}", reflections.getConfiguration().getUrls().size());
        Set<Method> methods = reflections.getMethodsAnnotatedWith(PolyFunction.class);
        log.info("Methods: {}", methods.size());
        return methods;
    }
}
