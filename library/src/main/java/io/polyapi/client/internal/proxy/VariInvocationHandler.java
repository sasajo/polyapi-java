package io.polyapi.client.internal.proxy;

import io.polyapi.client.api.model.PolyEntity;
import io.polyapi.client.internal.service.InvocationService;
import io.polyapi.client.internal.service.VariableInjectManager;
import io.polyapi.commons.api.error.PolyApiException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.lang.reflect.InvocationHandler;
import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;
import java.util.stream.Stream;

public class VariInvocationHandler implements InvocationHandler {
    private static final Logger logger = LoggerFactory.getLogger(PolyInvocationHandler.class);
    private final InvocationService invocationService;

    public VariInvocationHandler(InvocationService invocationService) {
        this.invocationService = invocationService;
    }

    @Override
    public Object invoke(Object proxy, Method method, Object[] arguments) {
        var polyData = proxy.getClass().getInterfaces()[0].getAnnotation(PolyEntity.class);
        logger.debug("Executing method {} in proxy class {}.", method, proxy.getClass().getSimpleName());
        logger.debug("Operating with server variable with ID '{}'.", polyData.value());
        var result = Stream.of(proxy.getClass().getInterfaces()[0].getInterfaces()[0].getMethods())
                .filter(parentInterfaceMethod -> parentInterfaceMethod.getName().equals(method.getName()))
                .findFirst()
                .map(parentInterfaceMethod -> {
                    try {
                        return parentInterfaceMethod.invoke(new DefaultServerVariableImpl<>(polyData.value(), proxy.getClass().getInterfaces()[0].getSimpleName().toLowerCase(), method.getGenericReturnType(), invocationService, VariableInjectManager.getInstance()), arguments);
                    } catch (IllegalAccessException e) {
                        // FIXME: Throw the appropriate exception.
                        throw new PolyApiException(e);
                    } catch (InvocationTargetException e) {
                        // FIXME: Throw the appropriate exception.
                        throw new PolyApiException(e);
                    }

                })
                .orElse("");
        logger.debug("Invocation successful.");
        return result;
    }
}
