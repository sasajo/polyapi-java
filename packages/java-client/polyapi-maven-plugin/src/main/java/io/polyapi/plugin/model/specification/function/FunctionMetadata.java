package io.polyapi.plugin.model.specification.function;

import io.polyapi.plugin.model.property.PropertyType;
import io.polyapi.plugin.model.property.VoidPropertyType;
import lombok.Getter;
import lombok.Setter;

import java.util.List;
import java.util.Optional;
import java.util.Set;

import static java.util.function.Predicate.not;
import static java.util.stream.Collectors.toSet;
import static java.util.stream.Stream.concat;

@Getter
@Setter
public class FunctionMetadata {
  private List<PropertyMetadata> arguments;
  private PropertyType returnType;
  private Boolean synchronous;

  public boolean getReturnsValue() {
    return Optional.ofNullable(returnType).filter(not(VoidPropertyType.class::isInstance)).isPresent();
  }

  public Set<String> getImports(String basePackage, String defaultType) {
    return returnType.getImports(basePackage, defaultType + "Response");
  }

  public String getResultType(String defaultValue) {
    if (getReturnsValue()) {
      return returnType.getResultType(defaultValue);
    } else {
      return "void";
    }
  }
}
