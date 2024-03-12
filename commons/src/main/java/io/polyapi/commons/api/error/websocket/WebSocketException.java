package io.polyapi.commons.api.error.websocket;

import io.polyapi.commons.api.error.PolyApiException;
import io.polyapi.commons.internal.websocket.SocketIOWebSocketClient;

/**
 * Parent class of all exceptions thrown by the {@link SocketIOWebSocketClient}.
 */
public class WebSocketException extends PolyApiException {

    public WebSocketException(String message) {
        super(message);
    }

    public WebSocketException(String message, Throwable cause) {
        super(message, cause);
    }
}
