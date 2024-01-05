package io.polyapi.plugin.model.property;

public class VoidPropertyType extends PropertyType {
  @Override
  public String getInCodeType() {
    return "void";
  }

  @Override
  public String getTypeSchema() {
    return null;
  }

  @Override
  public String getResultType(String defaultType) {
    return "void";
  }
}
