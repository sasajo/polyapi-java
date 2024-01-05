package io.polyapi.plugin.model.property;

import io.polyapi.plugin.model.specification.function.FunctionMetadata;
import lombok.Getter;
import lombok.Setter;

import java.util.Set;
import java.util.function.Function;

@Getter
@Setter
public class FunctionPropertyType extends PropertyType {
  private String name;
  private FunctionMetadata spec;

  @Override
  public String getTypeSchema() {
    return null;
  }

  @Override
  public String getResultType(String defaultType) {
    return Function.class.getName();
  }

  @Override
  public Set<String> getImports(String basePackage, String defaultType) {
    return Set.of(Function.class.getName());
  }
}
