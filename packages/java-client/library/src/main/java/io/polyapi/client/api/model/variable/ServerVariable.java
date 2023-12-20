package io.polyapi.client.api.model.variable;

import io.polyapi.commons.api.model.PolyObject;

public interface ServerVariable<T> extends PolyObject {
  void update(T entity);
}
