package io.polyapi.plugin.model.specification;

import io.polyapi.plugin.model.property.PropertyType;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class FunctionSpecification {
  private List<PropertySpecification> arguments;
  private PropertyType returnType;
  private Boolean synchronous;
}
