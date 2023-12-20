package io.polyapi.client.internal.proxy;

import io.polyapi.client.api.model.PolyEntity;
import io.polyapi.client.api.model.PolyMetadata;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.lang.reflect.InvocationHandler;
import java.lang.reflect.Method;
import java.util.List;

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
    var polyData = method.getDeclaringClass().getAnnotation(PolyEntity.class);
    var polyMetadata = method.getDeclaringClass().getAnnotation(PolyMetadata.class);
    logger.debug("Executing method {} in proxy class {}.", method, proxy.getClass().getSimpleName());
    logger.debug("Executing Poly function with ID '{}'.", polyData.value());
    logger.debug("Poly metadata param names: {}.", polyMetadata.paramNames());
    logger.debug("Poly metadata param types: {}.", polyMetadata.paramTypes());
    return invocation.invoke(polyData.value(),
      range(0, arguments.length)
        .boxed()
        .collect(toMap(List.of(polyMetadata.paramNames())::get,
          List.of(arguments)::get)),
      method.getGenericReturnType());
  }
}
