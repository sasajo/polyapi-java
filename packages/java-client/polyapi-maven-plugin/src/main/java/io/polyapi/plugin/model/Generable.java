package io.polyapi.plugin.model;

import io.polyapi.commons.api.model.PolyObject;
import io.polyapi.plugin.utils.StringUtils;

import static io.polyapi.plugin.utils.StringUtils.toPascalCase;

// FIXME: Add an appropriate name for this interface.
public interface Generable extends PolyObject {

  String getPackageName();

  default String getClassName() {
    return toPascalCase(getName());
  }

  String getName();
}
