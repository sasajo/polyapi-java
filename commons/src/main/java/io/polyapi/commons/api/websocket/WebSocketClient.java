package io.polyapi.commons.api.websocket;

import io.polyapi.commons.api.model.PolyEventConsumer;

import java.lang.reflect.Type;
import java.util.function.Consumer;

public interface WebSocketClient extends AutoCloseable {

    /**
     * Registers an event on the server so that it triggers a consumer every time an event is dispatched.
     *
     * @param event     The event to listen to.
     * @param handleId  The ID of the emitter of the event in the server.
     * @param eventType The type of object to be handled by the consumer. This parameter is so that a proper casting can be done.
     * @param trigger   The {@link Consumer} that will be triggered every time a listener comes. This should be a stateless object.
     * @param <T>       The type of object that is received from the server.
     * @return Handle An object that handles the listener.
     */
    <T> Handle registerTrigger(String event, String handleId, Type eventType, PolyEventConsumer<T> trigger);

    <T> Handle registerAuthFunctionEventHandler(String id, PolyEventConsumer<T> trigger);
}
