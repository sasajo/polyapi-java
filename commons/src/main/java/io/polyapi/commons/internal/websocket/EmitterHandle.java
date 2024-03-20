package io.polyapi.commons.internal.websocket;

import io.polyapi.commons.api.websocket.Handle;
import io.socket.emitter.Emitter;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Default implementation of {@link Handle} that works with an {@link Emitter} to do its operations.
 */
public class EmitterHandle implements Handle {
    private static final Logger log = LoggerFactory.getLogger(EmitterHandle.class);
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