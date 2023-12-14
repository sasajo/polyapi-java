package io.polyapi.client.internal.proxy;

import io.polyapi.commons.api.model.PolyEntity;
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
    PolyEntity polyData = method.getDeclaringClass().getAnnotation(PolyEntity.class);
    logger.debug("Executing method {} in proxy class {}.", method, proxy.getClass().getSimpleName());
    logger.debug("Executing Poly function with ID '{}'.", polyData.value());
    return invocation.invoke(polyData.value(),
      range(0, arguments.length)
        .boxed()
        .collect(toMap(List.of(polyData.metadata().paramNames())::get,
          List.of(arguments)::get)),
      method.getReturnType());
  }
}
