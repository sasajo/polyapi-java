package io.polyapi.client.api;

import java.util.IdentityHashMap;
import java.util.Map;

public class VariableInjectManager {
  private static VariableInjectManager instance;

  private final Map<Object, InjectedVariable> injectedVariables = new IdentityHashMap<>();

  private VariableInjectManager() {
  }

  // FIXME: This should not be a singleton.
  public static VariableInjectManager getInstance() {
    if (instance == null) {
      instance = new VariableInjectManager();
    }
    return instance;
  }

  public void saveInjectedVariable(Object variableValue, InjectedVariable variable) {
    injectedVariables.put(variableValue, variable);
  }

  public Object getInjectedValueOrOriginal(Object value) {
    var injectedVariable = injectedVariables.remove(value);
    if (injectedVariable == null) {
      return value;
    }
    return injectedVariable;
  }
}
