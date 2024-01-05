package io.polyapi.plugin.service;

import org.jsonschema2pojo.DefaultGenerationConfig;

public class PolyGenerationConfig extends DefaultGenerationConfig {

  @Override
  public boolean isIncludeToString() {
    return false;
  }

  @Override
  public boolean isIncludeHashcodeAndEquals() {
    return false;
  }

  @Override
  public boolean isUseLongIntegers() {
    return true;
  }

  @Override
  public boolean isIncludeAdditionalProperties() {
    return false;
  }
}
