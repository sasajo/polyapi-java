package io.polyapi.client.internal.model;

import io.polyapi.client.api.model.variable.RetrievableServerVariable;
import io.polyapi.client.api.model.variable.ServerVariable;
import io.polyapi.client.internal.proxy.PolyProxyFactory;
import io.polyapi.client.api.model.function.PolyApiFunction;
import io.polyapi.client.api.model.function.PolyServerFunction;

import java.lang.reflect.Type;

public class PolyContext {
  private final PolyProxyFactory proxyFactory;

  public PolyContext(PolyProxyFactory proxyFactory) {
    this.proxyFactory = proxyFactory;
  }

  protected <T extends PolyServerFunction> T createServerFunctionProxy(Class<T> polyInterface) {
    return proxyFactory.createServerFunctionProxy(polyInterface);
  }

  protected <T extends PolyApiFunction> T createApiFunctionProxy(Class<T> polyInterface) {
    return proxyFactory.createApiFunctionProxy(polyInterface);
  }

  protected <T extends ServerVariable> T createServerVariableProxy(Class<T> polyInterface) {
    return proxyFactory.createServerVariableProxy(polyInterface);
  }

  protected <T extends RetrievableServerVariable> T createRetrievableServerVariableProxy(Class<T> polyInterface) {
    return proxyFactory.createRetrievableServerVariable(polyInterface);
  }
}
