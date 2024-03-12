package io.polyapi.commons.api.error.websocket;

import java.lang.reflect.Type;

import static java.lang.String.format;

/**
 * Exception thrown when the expected type of an input differs from what the server sent.
 */
public class WebsocketInputParsingException extends WebSocketException {
    public WebsocketInputParsingException(Type expectedType, Throwable cause) {
        super(format("Server sent an object that is not of type '%s'.", expectedType.getTypeName()), cause);
    }
}
