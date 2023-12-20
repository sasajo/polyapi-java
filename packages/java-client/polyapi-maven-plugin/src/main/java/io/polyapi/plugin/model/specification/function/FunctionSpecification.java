package io.polyapi.plugin.model.specification.function;

import io.polyapi.plugin.model.specification.Specification;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public abstract class FunctionSpecification extends Specification {
  private FunctionMetadata function;

  @Override
  protected String getTypePackage() {
    return "function." + getSubtypePackage();
  }

  protected abstract String getSubtypePackage();
}
