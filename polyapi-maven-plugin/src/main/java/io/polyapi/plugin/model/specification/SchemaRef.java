package io.polyapi.plugin.model.specification;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class SchemaRef {
  private String publicNamespace = "";
  private String path;
}
