package io.polyapi.commons.internal.websocket;

import io.polyapi.commons.api.error.parse.JsonToObjectParsingException;
import io.polyapi.commons.api.error.websocket.WebsocketInputParsingException;
import io.polyapi.commons.api.json.JsonParser;
import io.polyapi.commons.api.model.PolyEvent;
import io.socket.emitter.Emitter;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import java.util.function.Consumer;

@Slf4j
@AllArgsConstructor
public class PolyEventListener<T extends PolyEvent> implements Emitter.Listener {
    private final String event;
    private final String handleId;
    private final JsonParser jsonParser;
    private final Class<T> eventType;
    private final Consumer<T> listener;

    @Override
    public void call(Object... objects) {
        try {
            log.debug("Received event {} on handle {}.", event, handleId);
            listener.accept(jsonParser.parseString(objects[0].toString(), eventType));
            log.debug("Input dispatched.");
        } catch (JsonToObjectParsingException e) {
            throw new WebsocketInputParsingException(eventType, e);
        }
    }
}
