package io.polyapi.client.internal.proxy.invocation.handler;

import io.polyapi.client.api.model.PolyEntity;
import io.polyapi.client.api.model.PolyMetadata;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.lang.reflect.InvocationHandler;
import java.lang.reflect.Method;
import java.util.HashMap;
import java.util.Map;

import static java.util.stream.Collectors.toMap;
import static java.util.stream.IntStream.range;

public class PolyInvocationHandler implements InvocationHandler {
  private static final Logger log = LoggerFactory.getLogger(PolyInvocationHandler.class);
  private final PolyInvocation invocation;

  public PolyInvocationHandler(PolyInvocation invocation) {
    this.invocation = invocation;
  }

  @Override
  public Object invoke(Object proxy, Method method, Object[] arguments) {
    Class<?> invokingClass = method.getDeclaringClass();
    var polyData = invokingClass.getAnnotation(PolyEntity.class);
    var polyMetadata = method.getDeclaringClass().getAnnotation(PolyMetadata.class);
    log.debug("Executing method {} in proxy class {}.", method, proxy.getClass().getSimpleName());
    log.debug("Executing Poly function with ID '{}'.", polyData.value());
    log.debug("Poly metadata param names: {}.", polyMetadata.paramNames());
    log.debug("Poly metadata param types: {}.", polyMetadata.paramTypes());
    Map<String, Object> body = new HashMap<>();
    range(0, polyMetadata.paramNames().length).boxed().forEach(i -> body.put(polyMetadata.paramNames()[i], arguments[i]));
    return invocation.invoke(invokingClass, polyData.value(), body, method.getGenericReturnType());
  }
}
