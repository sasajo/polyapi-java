package io.polyapi.client.internal.proxy.invocation.handler;

import java.lang.reflect.InvocationHandler;
import java.lang.reflect.Method;
import java.util.function.Consumer;

import io.polyapi.client.api.model.PolyEntity;
import io.polyapi.client.api.model.PolyMetadata;
import io.polyapi.client.error.PolyApiLibraryException;
import io.polyapi.commons.api.model.PolyEventConsumer;
import io.polyapi.commons.api.websocket.WebSocketClient;
import lombok.extern.slf4j.Slf4j;

@Slf4j
public class PolyTriggerInvocationHandler implements InvocationHandler {

    private final WebSocketClient webSocketClient;

    public PolyTriggerInvocationHandler(WebSocketClient webSocketClient) {
        this.webSocketClient = webSocketClient;
    }

    @Override
    @SuppressWarnings("unchecked")
    public Object invoke(Object proxy, Method method, Object[] args) {
        try {
            PolyEventConsumer<?> consumer = method.getParameterTypes()[0].equals(Consumer.class)? (payload, headers, params) -> ((Consumer<Object>)args[0]).accept(payload) : PolyEventConsumer.class.cast(args[0]);
            Class<?> invokingClass = method.getDeclaringClass();
            var polyData = invokingClass.getAnnotation(PolyEntity.class);
            var polyMetadata = method.getDeclaringClass().getAnnotation(PolyMetadata.class);
            log.debug("Executing method {} in proxy class {}.", method, proxy.getClass().getSimpleName());
            log.debug("Registering Poly trigger with ID '{}'.", polyData.value());
            log.debug("Event type: {}.", polyMetadata.paramTypes()[0]);
            return webSocketClient.registerTrigger("handleWebhookEvent", polyData.value(), Class.forName(polyMetadata.paramTypes()[0]), consumer);
        } catch (ClassNotFoundException e) {
            throw new PolyApiLibraryException(e); // FIXME: Throw the appropriate exception.
        }
    }
}
