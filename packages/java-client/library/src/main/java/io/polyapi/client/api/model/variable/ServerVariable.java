package io.polyapi.client.api.model.variable;

import io.polyapi.commons.api.model.PolyObject;

public interface ServerVariable<T> extends PolyObject {
  void update(T entity);

  String inject();

  String inject(String path);

  <T> T inject(Class<T> clazz);

  <T> T inject(String path, Class<T> clazz);
}
