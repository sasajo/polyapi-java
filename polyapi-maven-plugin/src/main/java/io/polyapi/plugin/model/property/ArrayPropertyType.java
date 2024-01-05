package io.polyapi.plugin.model.property;

import lombok.Getter;
import lombok.Setter;

import java.util.List;
import java.util.Set;
import java.util.stream.Stream;

import static java.lang.String.format;
import static java.util.stream.Collectors.toSet;
import static java.util.stream.Stream.concat;

@Getter
@Setter
public class ArrayPropertyType extends PropertyType {
  private PropertyType items;

  @Override
  public String getInCodeType() {
    return "java.util.List<" + items.getInCodeType() + ">";
  }

  @Override
  public String getTypeSchema() {
    return items.getTypeSchema();
  }

  @Override
  public String getResultType(String defaultType) {
    return format("%s<%s>", List.class.getName(), items.getResultType(defaultType));
  }

  @Override
  public Set<String> getImports(String basePackage, String defaultType) {
    return concat(Stream.of(Set.class.getName()), items.getImports(basePackage, defaultType).stream()).collect(toSet());
  }
}
