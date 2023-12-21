package io.polyapi.client.internal.proxy;

import io.polyapi.client.api.model.PolyEntity;
import io.polyapi.client.internal.service.InvocationService;
import io.polyapi.commons.api.error.PolyApiException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.lang.reflect.InvocationHandler;
import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;

import static io.polyapi.client.api.VariableInjectManager.getInstance;

public class VariInvocationHandler implements InvocationHandler {
  private static final Logger logger = LoggerFactory.getLogger(PolyInvocationHandler.class);
  private final InvocationService invocationService;

  public VariInvocationHandler(InvocationService invocationService) {
    this.invocationService = invocationService;
  }

  @Override
  public Object invoke(Object proxy, Method method, Object[] arguments) {
    try {
      var polyData = method.getDeclaringClass().getAnnotation(PolyEntity.class);
      logger.debug("Executing method {} in proxy class {}.", method, proxy.getClass().getSimpleName());
      logger.debug("Operating with server variable with ID '{}'.", polyData.value());
      var result = method.invoke(new DefaultServerVariableImpl<>(polyData.value(), method.getGenericReturnType(), invocationService, getInstance()), arguments);
      logger.debug("Invocation successful.");
      return result;
    } catch (IllegalAccessException e) {
      // FIXME: Throw the appropriate exception.
      throw new PolyApiException(e);
    } catch (InvocationTargetException e) {
      // FIXME: Throw the appropriate exception.
      throw new PolyApiException(e);
    }
  }
}
