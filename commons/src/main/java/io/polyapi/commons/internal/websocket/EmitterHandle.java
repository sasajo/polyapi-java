package io.polyapi.commons.internal.websocket;

import io.polyapi.commons.api.websocket.Handle;
import io.socket.emitter.Emitter;
import lombok.extern.slf4j.Slf4j;

/**
 * Default implementation of {@link Handle} that works with an {@link Emitter} to do its operations.
 */
@Slf4j
public class EmitterHandle implements Handle {
    private final Emitter emitter;
    private final String eventType;

    public EmitterHandle(String eventType, Emitter emitter) {
        this.eventType = eventType;
        this.emitter = emitter;
    }


    /**
     * Stops listening to the event.
     */
    @Override
    public void close() {
        log.debug("Closing listener of for event type '{}'.", eventType);
        emitter.off(eventType);
        log.debug("Listener closed.");
    }
}