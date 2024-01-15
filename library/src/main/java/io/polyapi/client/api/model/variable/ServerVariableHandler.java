package io.polyapi.client.api.model.variable;

import io.polyapi.client.api.model.function.PolyFunction;

public interface ServerVariableHandler<T> extends PolyFunction {

  T inject();

  void update(T entity);
}
