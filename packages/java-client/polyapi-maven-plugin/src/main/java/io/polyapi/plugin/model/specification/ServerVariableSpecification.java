package io.polyapi.plugin.model.specification;

import io.polyapi.plugin.utils.StringUtils;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ServerVariableSpecification extends Specification {
  private VariableSpecification variable;

  @Override
  protected String getTypePackage() {
    return "variable.server";
  }
}
