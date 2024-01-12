package io.polyapi.client.api.model.variable;

import io.polyapi.client.api.model.PolyProxy;

public interface ServerVariable<T> extends PolyProxy {
  void update(T entity);

  default T inject(String... paramNames) {
    return this.inject(null, paramNames);
  }

  T inject(PolyProxy injectable, String... paramNames);
}
