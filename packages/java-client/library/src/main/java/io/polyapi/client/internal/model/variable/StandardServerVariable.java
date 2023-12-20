package io.polyapi.client.internal.model.variable;

import io.polyapi.client.api.model.variable.ServerVariable;
import io.polyapi.client.internal.service.InvocationService;

import java.lang.reflect.Type;
import java.util.HashMap;
import java.util.Map;

public class StandardServerVariable<T> implements ServerVariable<T> {
  private final InvocationService invocationService;
  private final String id;
  private final Type type;

  public StandardServerVariable(String id, Type type, InvocationService invocationService) {
    this.id = id;
    this.type = type;
    this.invocationService = invocationService;
  }

  protected T get() {
    return invocationService.getVariable(id, type);
  }

  @Override
  public void update(T entity) {
    Map<String, T> body = new HashMap<>();
    body.put("value", entity);
    invocationService.updateVariable(id, body);
  }
}
