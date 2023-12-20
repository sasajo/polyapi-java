package io.polyapi.plugin.model.specification.function;

import io.polyapi.plugin.model.specification.function.FunctionSpecification;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ServerFunctionSpecification extends FunctionSpecification {
  private String[] requirements;
  private String code;
  private String language;

  @Override
  protected String getSubtypePackage() {
    return "server";
  }
}
