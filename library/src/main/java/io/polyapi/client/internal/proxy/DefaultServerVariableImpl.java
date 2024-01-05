package io.polyapi.client.internal.proxy;

import io.polyapi.client.api.InjectedVariable;
import io.polyapi.client.api.VariableInjectManager;
import io.polyapi.client.api.model.variable.ServerVariable;
import io.polyapi.client.internal.service.InvocationService;
import io.polyapi.commons.api.error.PolyApiException;

import java.lang.reflect.Type;
import java.util.HashMap;
import java.util.Map;

import static java.lang.Boolean.FALSE;

public class DefaultServerVariableImpl<T> implements ServerVariable<T> {
  private static final Map<Class<?>, Object> DEFAULT_VALUES = Map.of(String.class, "", Integer.class, 0, Long.class, 0L, Double.class, 0D, Boolean.class, FALSE, Float.class, 0F);
  private final InvocationService invocationService;
  private final String id;
  private final Type type;
  private final VariableInjectManager variableInjectManager;

  public DefaultServerVariableImpl(String id, Type type, InvocationService invocationService, VariableInjectManager variableInjectManager) {
    this.id = id;
    this.type = type;
    this.invocationService = invocationService;
    this.variableInjectManager = variableInjectManager;
  }

  @Override
  public void update(T entity) {
    Map<String, T> body = new HashMap<>();
    body.put("value", entity);
    invocationService.updateVariable(id, body);
  }

  public String inject() {
    return inject(null, String.class);
  }

  public String inject(String path) {
    return inject(path, String.class);
  }

  public <T> T inject(Class<T> clazz) {
    return inject(null, clazz);
  }

  public <T> T inject(String path, Class<T> clazz) {
    Object value;
    if (DEFAULT_VALUES.containsKey(clazz)) {
      value = DEFAULT_VALUES.get(clazz);
    } else {
      try {
        value = clazz.newInstance();
      } catch (InstantiationException | IllegalAccessException e) {
        // FIXME: Throw an appropriate exception.
        throw new PolyApiException(e);
      }
    }
    variableInjectManager.saveInjectedVariable(value, new InjectedVariable(id, path));
    return (T) value;
  }

  public T get() {
    return invocationService.getVariable(id, type);
  }
}
