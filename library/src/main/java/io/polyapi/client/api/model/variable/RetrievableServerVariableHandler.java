package io.polyapi.client.api.model.variable;

public interface RetrievableServerVariableHandler<T> extends ServerVariableHandler<T> {
  T get();
}
