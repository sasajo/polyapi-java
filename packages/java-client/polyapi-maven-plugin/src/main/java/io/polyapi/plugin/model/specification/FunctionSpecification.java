package io.polyapi.plugin.model.specification;

import io.polyapi.plugin.model.property.PropertyType;
import io.polyapi.plugin.model.property.VoidPropertyType;
import lombok.Getter;
import lombok.Setter;

import java.util.List;
import java.util.Optional;

import static java.util.function.Predicate.not;

@Getter
@Setter
public class FunctionSpecification {
  private List<PropertySpecification> arguments;
  private PropertyType returnType;
  private Boolean synchronous;

  public boolean getReturnsValue() {
    return Optional.ofNullable(returnType).filter(not(VoidPropertyType.class::isInstance)).isPresent();
  }
}
