package io.polyapi.plugin.model.property;

import com.fasterxml.jackson.databind.JsonNode;
import io.polyapi.plugin.model.specification.PropertySpecification;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class ObjectPropertyType extends PropertyType {
  private JsonNode schema;
  private List<PropertySpecification> properties;
  private String typeName;

  @Override
  public String getInCodeType() {
    if (typeName != null && !typeName.isEmpty()) {
      return typeName;
    }
    return "Object";
  }
}
