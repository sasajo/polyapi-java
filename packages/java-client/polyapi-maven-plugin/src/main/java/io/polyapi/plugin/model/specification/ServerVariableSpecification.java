package io.polyapi.plugin.model.specification;

import io.polyapi.plugin.utils.StringUtils;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ServerVariableSpecification extends Specification {
  private VariableSpecification variable;

  public String getClassName() {
    return StringUtils.toPascalCase(getName());
  }
}
