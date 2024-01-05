package io.polyapi.plugin.model.property;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class PlainPropertyType extends PropertyType {
  private String value;

  @Override
  public String getTypeSchema() {
    return null;
  }

  @Override
  public String getResultType(String defaultType) {
    return "String";
  }
}

