package io.polyapi.client.internal.proxy.invocation.handler;

import io.polyapi.client.api.model.PolyEntity;
import io.polyapi.client.api.model.PolyMetadata;
import io.polyapi.client.error.PolyApiLibraryException;
import io.polyapi.commons.api.websocket.WebSocketClient;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.lang.reflect.InvocationHandler;
import java.lang.reflect.Method;
import java.util.function.Consumer;

public class PolyTriggerInvocationHandler implements InvocationHandler {
    private static final Logger log = LoggerFactory.getLogger(PolyTriggerInvocationHandler.class);

    private final WebSocketClient webSocketClient;

    public PolyTriggerInvocationHandler(WebSocketClient webSocketClient) {
        this.webSocketClient = webSocketClient;
    }

    @Override
    public Object invoke(Object proxy, Method method, Object[] args) {
        try {
            Class<?> invokingClass = method.getDeclaringClass();
            var polyData = invokingClass.getAnnotation(PolyEntity.class);
            var polyMetadata = method.getDeclaringClass().getAnnotation(PolyMetadata.class);
            log.debug("Executing method {} in proxy class {}.", method, proxy.getClass().getSimpleName());
            log.debug("Registering Poly trigger with ID '{}'.", polyData.value());
            log.debug("Event type: {}.", polyMetadata.paramTypes()[0]);
            return webSocketClient.registerTrigger("handleWebhookEvent", polyData.value(), Class.forName(polyMetadata.paramTypes()[0]), Consumer.class.cast(args[0]));
        } catch (ClassNotFoundException e) {
            throw new PolyApiLibraryException(e); // FIXME: Throw the appropriate exception.
        }
    }
}
