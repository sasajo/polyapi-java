package io.polyapi.client.internal.model;

import io.polyapi.client.internal.proxy.PolyProxyFactory;
import io.polyapi.commons.api.model.PolyObject;

public class PolyContext {
  private final PolyProxyFactory proxyFactory;

  public PolyContext(PolyProxyFactory proxyFactory) {
    this.proxyFactory = proxyFactory;
  }

  protected <T extends PolyObject> T createServerFunctionProxy(Class<T> polyInterface) {
    return proxyFactory.createServerFunctionProxy(polyInterface);
  }
}
