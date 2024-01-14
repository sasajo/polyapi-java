package io.polyapi.client.api.model.variable;

import io.polyapi.client.api.model.function.PolyFunction;

public interface ServerVariableHandler<T> extends PolyFunction {
  void update(T entity);
}
