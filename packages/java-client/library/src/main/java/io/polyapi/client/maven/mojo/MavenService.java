package io.polyapi.client.maven.mojo;

import org.apache.maven.model.ConfigurationContainer;
import org.apache.maven.project.MavenProject;
import org.codehaus.plexus.util.xml.Xpp3Dom;

import java.util.Objects;
import java.util.Optional;

public class MavenService {
  private MavenProject project;

  public MavenService(MavenProject project) {
    this.project = project;
  }

  public String getPropertyFromPlugin(String propertyName) {
    return getPropertyFromPlugin("io.polyapi.client", "library", propertyName);
  }

  public String getPropertyFromPlugin(String pluginGroupId, String pluginArtifactId, String propertyName) {
    return project.getBuild().getPlugins().stream()
      .filter(plugin -> pluginGroupId.equals(plugin.getGroupId()))
      .filter(plugin -> pluginArtifactId.equals(plugin.getArtifactId()))
      .map(plugin -> Optional.ofNullable(plugin.getConfiguration())
        .orElseGet(() -> plugin.getExecutions().stream()
          .findFirst()
          .map(ConfigurationContainer::getConfiguration)
          .orElse(null)))
      .filter(Objects::nonNull)
      .map(Xpp3Dom.class::cast)
      .map(configuration -> configuration.getChild(propertyName))
      .filter(Objects::nonNull)
      .map(Xpp3Dom::getValue)
      .findFirst()
      .orElse(null);
  }
}
