package io.polyapi.client.internal.proxy;

import io.polyapi.commons.api.model.PolyObject;

import java.lang.reflect.Type;
import java.util.Map;

/**
 * Functional interface that identifies the invocations to be done by the {@link PolyInvocationHandler}.
 */
@FunctionalInterface
public interface PolyInvocation {

  /**
   * Executes the invocation.
   *
   * @param invokingClass The class doing the invocation.
   * @param polyFunctionId The ID of the function to invoke.
   * @param body           The body of the invocation.
   * @param returnType     The expected type return.
   * @return The result of the invocation.
   */
  Object invoke(Class<?> invokingClass, String polyFunctionId, Map<String, Object> body, Type returnType);
}
