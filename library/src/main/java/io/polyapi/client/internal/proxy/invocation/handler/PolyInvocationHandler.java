package io.polyapi.client.internal.proxy.invocation.handler;

import io.polyapi.client.api.model.PolyEntity;
import io.polyapi.client.api.model.PolyMetadata;
import lombok.extern.slf4j.Slf4j;

import java.lang.reflect.InvocationHandler;
import java.lang.reflect.Method;
import java.util.HashMap;
import java.util.Map;
import java.util.Arrays;

import static java.util.stream.Collectors.joining;
import static java.util.stream.IntStream.range;

@Slf4j
public class PolyInvocationHandler implements InvocationHandler {
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
    
    log.debug("Poly metadata param names: {}.", Arrays.stream(polyMetadata.paramNames()).collect(joining(",")));
    log.debug("Poly metadata param types: {}.", Arrays.stream(polyMetadata.paramTypes()).collect(joining(",")));
    Map<String, Object> body = new HashMap<>();
    range(0, polyMetadata.paramNames().length).boxed()
        .forEach(i -> body.put(polyMetadata.paramNames()[i], arguments[i]));
    return invocation.invoke(invokingClass, polyData.value(), body, method.getGenericReturnType());
  }
}
