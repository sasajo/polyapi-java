package io.polyapi.client.api.model.variable;

public interface RetrievableServerVariable<T> extends ServerVariable<T> {
  T get();
}
