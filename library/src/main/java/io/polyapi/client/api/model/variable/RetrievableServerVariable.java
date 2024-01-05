package io.polyapi.client.api.model.variable;

import java.lang.reflect.Type;

public interface RetrievableServerVariable<T> extends ServerVariable<T> {
  T get();
}
