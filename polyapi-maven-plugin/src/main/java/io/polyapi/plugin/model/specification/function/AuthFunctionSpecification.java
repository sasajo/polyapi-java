package io.polyapi.plugin.model.specification.function;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AuthFunctionSpecification extends FunctionSpecification {
  private String subResource;

  public boolean isAudienceRequired() {
    return getFunction().getArguments().stream().anyMatch(argument -> argument.getName().equals("audience"));
  }

  @Override
  protected String getSubtypePackage() {
    return "auth";
  }
}

