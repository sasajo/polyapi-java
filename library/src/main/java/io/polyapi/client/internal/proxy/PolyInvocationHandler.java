package io.polyapi.client.internal.proxy;

import io.polyapi.client.api.model.PolyEntity;
import io.polyapi.client.api.model.PolyMetadata;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.lang.reflect.InvocationHandler;
import java.lang.reflect.Method;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Stream;

import static java.util.stream.Collectors.toMap;
import static java.util.stream.IntStream.range;

public class PolyInvocationHandler implements InvocationHandler {
  private static final Logger logger = LoggerFactory.getLogger(PolyInvocationHandler.class);
  private final PolyInvocation invocation;

  public PolyInvocationHandler(PolyInvocation invocation) {
    this.invocation = invocation;
  }

  @Override
  public Object invoke(Object proxy, Method method, Object[] arguments) {
    Class<?> invokingClass = method.getDeclaringClass();
    var polyData = invokingClass.getAnnotation(PolyEntity.class);
    var polyMetadata = method.getDeclaringClass().getAnnotation(PolyMetadata.class);
    logger.debug("Executing method {} in proxy class {}.", method, proxy.getClass().getSimpleName());
    logger.debug("Executing Poly function with ID '{}'.", polyData.value());
    logger.debug("Poly metadata param names: {}.", polyMetadata.paramNames());
    logger.debug("Poly metadata param types: {}.", polyMetadata.paramTypes());
    Map<String, Object> body = new HashMap<>();
    range(0, polyMetadata.paramNames().length).boxed().forEach(i -> body.put(polyMetadata.paramNames()[i], arguments[i]));
    return invocation.invoke(invokingClass, polyData.value(), body, method.getGenericReturnType());
  }
}
