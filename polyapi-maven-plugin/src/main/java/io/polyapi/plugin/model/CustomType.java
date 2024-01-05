package io.polyapi.plugin.model;

import lombok.Getter;

@Getter
public class CustomType implements Generable {
  private final String packageName;
  private final String name;
  private final String code;

  public CustomType(String packageName, String name, String code) {
    this.packageName = packageName;
    this.name = name;
    this.code = code;
  }
}
