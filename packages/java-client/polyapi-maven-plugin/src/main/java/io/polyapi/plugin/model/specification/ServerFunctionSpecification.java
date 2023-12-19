package io.polyapi.plugin.model.specification;

import io.polyapi.plugin.utils.StringUtils;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ServerFunctionSpecification extends Specification {
  private FunctionSpecification function;
  private String[] requirements;
  private String code;
  private String language;

  @Override
  protected String getTypePackage() {
    return "function.server";
  }
}
