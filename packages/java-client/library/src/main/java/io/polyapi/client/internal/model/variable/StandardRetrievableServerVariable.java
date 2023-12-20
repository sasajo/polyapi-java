package io.polyapi.client.internal.model.variable;

import io.polyapi.client.api.model.variable.RetrievableServerVariable;
import io.polyapi.client.internal.service.InvocationService;

import java.lang.reflect.Type;

public class StandardRetrievableServerVariable<T> extends StandardServerVariable<T> implements RetrievableServerVariable<T> {

  public StandardRetrievableServerVariable(String id, Type type, InvocationService invocationService) {
    super(id, type, invocationService);
  }

  @Override
  public T get() {
    return super.get();
  }
}
