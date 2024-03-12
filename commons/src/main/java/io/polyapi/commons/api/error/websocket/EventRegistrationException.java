package io.polyapi.commons.api.error.websocket;

import static java.lang.String.format;

/**
 * Exception thrown when an error occurs while registering an event.
 */
public class EventRegistrationException extends WebSocketException {
    private static final String MESSAGE_TEMPLATE = "An error occurred while registering a webhook trigger for events of type '%s' with handleId '%s'.";

    public EventRegistrationException(String event, String handleId) {
        super(format(MESSAGE_TEMPLATE, event, handleId));
    }

    public EventRegistrationException(String event, String handleId, Throwable cause) {
        super(format(MESSAGE_TEMPLATE, event, handleId), cause);
    }
}
