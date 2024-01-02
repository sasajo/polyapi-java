package io.polyapi.client.internal.proxy;

import io.polyapi.client.api.model.PolyEntity;
import io.polyapi.client.api.model.function.PolyApiFunction;
import io.polyapi.client.api.model.function.auth.AudienceTokenAuthFunction;
import io.polyapi.client.api.model.function.auth.SubresourceAuthFunction;
import io.polyapi.client.api.model.function.auth.TokenAuthFunction;
import io.polyapi.client.api.model.function.server.PolyServerFunction;
import io.polyapi.client.api.model.variable.ServerVariable;
import io.polyapi.client.internal.service.InvocationService;
import io.polyapi.commons.api.model.PolyObject;

import java.lang.reflect.InvocationHandler;
import java.lang.reflect.Proxy;

import static java.lang.String.format;
import static java.lang.reflect.Proxy.newProxyInstance;

public class PolyProxyFactory {
  private final InvocationHandler apiFunctionInvocationHandler;
  private final InvocationHandler serverFunctionInvocationHandler;
  private final InvocationHandler subresourceAuthFunctionInvocationHandler;
  private final InvocationHandler authFunctionInvocationHandler;
  private final InvocationHandler serverVariableInvocationHandler;

  public PolyProxyFactory(InvocationService invocationService) {
    this.serverFunctionInvocationHandler = new PolyInvocationHandler(invocationService::invokeServerFunction);
    this.apiFunctionInvocationHandler = new PolyInvocationHandler(invocationService::invokeApiFunction);
    this.authFunctionInvocationHandler = new PolyInvocationHandler(invocationService::invokeAuthFunction);
    this.subresourceAuthFunctionInvocationHandler = new PolyInvocationHandler(invocationService::invokeSubresourceAuthFunction);
    this.serverVariableInvocationHandler = new VariInvocationHandler(invocationService);
  }

  /**
   * Creates a proxy for a determined {@link PolyObject} that uses the invocationHandler for server functions. This
   * method only accepts interfaces. If something other is sent as an argument, an {@link IllegalArgumentException} will be thrown.
   *
   * @param polyInterface The interface to proxy.
   * @param <T>           The type of the interface.
   * @return PolyObject A {@link Proxy} that implements of the expected interface.
   * @throws IllegalArgumentException Thrown when a class that is not an interface is set as argument.
   * @throws IllegalArgumentException Thrown when a class that is not an interface is set as argument.
   */
  public <T extends PolyServerFunction> T createServerFunctionProxy(Class<T> polyInterface) {
    return createProxy(serverFunctionInvocationHandler, polyInterface);
  }

  /**
   * Creates a proxy for a determined {@link PolyObject} that uses the invocationHandler for API functions. This
   * method only accepts interfaces. If something other is sent as an argument, an {@link IllegalArgumentException} will be thrown.
   *
   * @param polyInterface The interface to proxy.
   * @param <T>           The type of the interface.
   * @return PolyObject A {@link Proxy} that implements of the expected interface.
   * @throws IllegalArgumentException Thrown when a class that is not an interface is set as argument.
   * @throws IllegalArgumentException Thrown when a class that is not an interface is set as argument.
   */
  public <T extends PolyApiFunction> T createApiFunctionProxy(Class<T> polyInterface) {
    return createProxy(apiFunctionInvocationHandler, polyInterface);
  }

  /**
   * Creates a proxy for a determined {@link PolyObject} that uses the invocationHandler for retrievable server variable
   * operations. This method only accepts interfaces. If something other is sent as an argument, an {@link IllegalArgumentException} will be thrown.
   *
   * @param polyInterface The interface to proxy.
   * @param <T>           The type of the interface.
   * @return PolyObject A {@link Proxy} that implements of the expected interface.
   * @throws IllegalArgumentException Thrown when a class that is not an interface is set as argument.
   * @throws IllegalArgumentException Thrown when a class that is not an interface is set as argument.
   */
  public <T extends ServerVariable<?>> T createServerVariableProxy(Class<T> polyInterface) {
    return createProxy(serverVariableInvocationHandler, polyInterface);
  }

  public <T extends TokenAuthFunction> T createTokenAuthProxy(Class<T> polyInterface) {
    return createProxy(authFunctionInvocationHandler, polyInterface);
  }

  public <T extends AudienceTokenAuthFunction> T createAudienceTokenAuthProxy(Class<T> polyInterface) {
    return createProxy(authFunctionInvocationHandler, polyInterface);
  }
  public <T extends SubresourceAuthFunction> T createSubresourceAuthProxy(Class<T> polyInterface) {
    return createProxy(subresourceAuthFunctionInvocationHandler, polyInterface);
  }

  private <T extends PolyObject> T createProxy(InvocationHandler invocationHandler, Class<T> polyInterface) {
    if (!polyInterface.isInterface()) {
      throw new IllegalArgumentException(format("Poly object defined is not an interface. Only interfaces are expected. Input class is '%s'", polyInterface.getName()));
    }
    if (polyInterface.getAnnotation(PolyEntity.class) == null) {
      throw new IllegalArgumentException(format("Poly object defined is not annotated by PolyEntity annotation. Input class is '%s'", polyInterface.getName()));
    }
    return polyInterface.cast(newProxyInstance(polyInterface.getClassLoader(), new Class[]{polyInterface}, invocationHandler));
  }

}
