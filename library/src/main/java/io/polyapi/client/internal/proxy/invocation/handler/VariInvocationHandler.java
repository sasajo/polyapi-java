package io.polyapi.client.internal.proxy.invocation.handler;

import io.polyapi.client.api.model.PolyEntity;
import io.polyapi.client.api.model.PolyMetadata;
import io.polyapi.client.internal.service.InvocationService;
import io.polyapi.commons.api.error.PolyApiException;
import lombok.extern.slf4j.Slf4j;

import java.lang.reflect.InvocationHandler;
import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;
import java.util.stream.Stream;

@Slf4j
public class VariInvocationHandler implements InvocationHandler {
    private final InvocationService invocationService;

    public VariInvocationHandler(InvocationService invocationService) {
        this.invocationService = invocationService;
    }

    @Override
    public Object invoke(Object proxy, Method method, Object[] arguments) {
        Class<?> serverVariableHandlerInterface = proxy.getClass().getInterfaces()[0];
        var polyData = serverVariableHandlerInterface.getAnnotation(PolyEntity.class);
        var declaredType = serverVariableHandlerInterface.getAnnotation(PolyMetadata.class).paramTypes()[0];
        log.debug("Executing method {} in proxy class {}.", method, proxy.getClass().getSimpleName());
        log.debug("Operating with server variable with ID '{}'.", polyData.value());
        var result = Stream.of(serverVariableHandlerInterface.getInterfaces()[0].getMethods())
                .filter(parentInterfaceMethod -> parentInterfaceMethod.getName().equals(method.getName()) && parentInterfaceMethod.getParameterCount() == method.getParameterCount())
                .findFirst()
                .map(parentInterfaceMethod -> {
                    try {
                        return parentInterfaceMethod.invoke(new DefaultServerVariableHandlerImpl<>(polyData.value(), method.getGenericReturnType(), declaredType, invocationService), arguments);
                    } catch (IllegalAccessException e) {
                        // FIXME: Throw the appropriate exception.
                        throw new PolyApiException(e);
                    } catch (InvocationTargetException e) {
                        // FIXME: Throw the appropriate exception.
                        throw new PolyApiException(e);
                    }

                })
                .orElse("");
        log.debug("Invocation successful.");
        return result;
    }
}
