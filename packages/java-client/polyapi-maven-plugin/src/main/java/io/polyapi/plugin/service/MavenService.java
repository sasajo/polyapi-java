package io.polyapi.plugin.service;

import io.polyapi.plugin.error.PolyApiMavenPluginException;
import io.polyapi.plugin.error.validation.PropertyNotFoundException;
import org.apache.maven.artifact.DependencyResolutionRequiredException;
import org.apache.maven.model.Plugin;
import org.apache.maven.model.PluginExecution;
import org.apache.maven.project.MavenProject;
import org.codehaus.plexus.util.xml.Xpp3Dom;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.File;
import java.net.MalformedURLException;
import java.net.URL;
import java.net.URLClassLoader;
import java.util.List;
import java.util.Objects;
import java.util.function.Consumer;
import java.util.stream.Stream;

import static java.util.stream.Stream.concat;

public class MavenService {
  private static final Logger logger = LoggerFactory.getLogger(MavenService.class);
  private MavenProject project;

  public MavenService(MavenProject project) {
    this.project = project;
  }

  public void getPropertyFromPlugin(String propertyName, String currentValue, Consumer<String> callback) {
    logger.debug("Checking value of '{}' as an input parameter.", propertyName);
    if (currentValue == null) {
      logger.debug("Parameter '{}' is empty. Attempting to retrieve it from plugin configuration.", propertyName);
      callback.andThen(value -> logger.debug("Parameter '{}' value is '{}'.", propertyName, value))
        .accept(getPropertyFromPlugin("io.polyapi.client", "library", propertyName));
    } else {
      logger.debug("Parameter '{}' value is '{}'", propertyName, currentValue);
    }
  }

  public String getPropertyFromPlugin(String pluginGroupId, String pluginArtifactId, String propertyName) {
    logger.debug("Scanning plugins.");
    List<Plugin> plugins = project.getBuild().getPlugins();
    logger.debug("Found {} plugins. Filtering by group ID matching '{}' and artifact ID matching '{}'.", plugins.size(), pluginGroupId, pluginArtifactId);
    return plugins.stream()
      .filter(plugin -> pluginGroupId.equals(plugin.getGroupId()))
      .filter(plugin -> pluginArtifactId.equals(plugin.getArtifactId()))
      .peek(plugin -> logger.debug("Found match: {}.{}:{}.\nRetrieving executions.", plugin.getGroupId(), plugin.getArtifactId(), plugin.getVersion()))
      .map(Plugin::getExecutions)
      .peek(pluginExecutions -> logger.debug("Found {} executions.", pluginExecutions.size()))
      .flatMap(List::stream)
      .map(PluginExecution::getConfiguration)
      .filter(Objects::nonNull)
      .map(Xpp3Dom.class::cast)
      .peek(configuration -> logger.debug("Found configuration within the execution. Retrieving children."))
      .map(Xpp3Dom::getChildren)
      .peek(children -> logger.debug("Found {} children properties.", children.length))
      .flatMap(Stream::of)
      .filter(Objects::nonNull)
      .peek(property -> logger.debug("Property '{}' found.", propertyName))
      .map(Xpp3Dom::getValue)
      .findFirst()
      .orElseThrow(() -> new PropertyNotFoundException(propertyName));
  }

  public ClassLoader getProjectClassLoader() {
    try {
      return new URLClassLoader(concat(concat(project.getCompileClasspathElements().stream(),
          project.getRuntimeClasspathElements().stream()),
        Stream.of(project.getBuild().getOutputDirectory()))
        .peek(classLoadingPath -> logger.debug("    Adding classloading path '{}'.", classLoadingPath))
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
        getClass().getClassLoader());
    } catch (DependencyResolutionRequiredException e) {
      throw new RuntimeException(e);
    }
  }

  public List<File> getSourceFolders() {
    return Stream.concat(project.getCompileSourceRoots().stream(), Stream.of(project.getBasedir() + "/target/generated-sources"))
      .peek(sourceRoot -> logger.debug("    Retrieving source root '{}'", sourceRoot))
      .map(File::new)
      .filter(File::exists)
      .toList();
  }

  public List<String> getJarSources() {
    try {
      return project.getCompileClasspathElements().stream()
        .filter(path -> path.endsWith(".jar"))
        .peek(path -> logger.debug("    Retrieving jar sources from '{}'.", path))
        .toList();
    } catch (DependencyResolutionRequiredException e) {
      // FIXME: Throw appropriate exception.
      throw new PolyApiMavenPluginException(e);
    }
  }
}
