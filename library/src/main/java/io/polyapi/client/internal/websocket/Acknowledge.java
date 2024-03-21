package io.polyapi.client.internal.websocket;

import io.socket.client.Ack;
import io.socket.client.Socket;
import io.socket.emitter.Emitter;
import lombok.extern.slf4j.Slf4j;

import static java.lang.String.format;

@Slf4j
public class Acknowledge implements Ack {
    private final Socket socket;
    private final String eventType;
    private final String eventId;
    private final Emitter.Listener callback;

    public Acknowledge(Socket socket, String eventType, String eventId, Emitter.Listener callback) {
        this.socket = socket;
        this.eventType = eventType;
        this.eventId = eventId;
        this.callback = callback;
    }

    @Override
    public void call(Object... args) {
        if (args[0].equals(true)) {
            socket.on(format("%s:%s", eventType, eventId), callback);
            log.debug("Event acknowledged.");
        } else {
            log.warn("Could not register event handler for {}", eventType);
        }
    }
}
