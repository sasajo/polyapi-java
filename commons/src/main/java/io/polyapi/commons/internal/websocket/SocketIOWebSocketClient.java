package io.polyapi.commons.internal.websocket;

import io.polyapi.commons.api.error.parse.JsonToObjectParsingException;
import io.polyapi.commons.api.error.websocket.EventRegistrationException;
import io.polyapi.commons.api.error.websocket.WebsocketInputParsingException;
import io.polyapi.commons.api.http.TokenProvider;
import io.polyapi.commons.api.json.JsonParser;
import io.polyapi.commons.api.websocket.Handle;
import io.polyapi.commons.api.websocket.WebSocketClient;
import io.socket.client.IO;
import io.socket.client.Socket;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.lang.reflect.Type;
import java.net.URI;
import java.util.Arrays;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutionException;
import java.util.function.Consumer;

import static java.lang.Boolean.FALSE;
import static java.lang.String.format;
import static java.util.concurrent.TimeUnit.MILLISECONDS;


public class SocketIOWebSocketClient implements WebSocketClient {
    private static final Logger logger = LoggerFactory.getLogger(SocketIOWebSocketClient.class);
    private final String url;
    private final TokenProvider tokenProvider;
    private final String clientId;
    private final Long registrationTimeout;
    private final JsonParser jsonParser;
    private Socket socket;

    public SocketIOWebSocketClient(String url, String clientId, TokenProvider tokenProvider, JsonParser jsonParser, Long registrationTimeout) {
        this.clientId = clientId;
        this.url = url;
        this.tokenProvider = tokenProvider;
        this.jsonParser = jsonParser;
        this.registrationTimeout = registrationTimeout;

    }

    private synchronized Socket getSocket() {
        if (this.socket == null) {
            this.socket = IO.socket(URI.create(format("%s/events", url)), IO.Options.builder()
                            .setTransports(new String[]{"websocket"})
                            .build())
                    .connect();
        }
        return socket;
    }

    public <T> Handle registerTrigger(String event, String handleId, Type eventType, Consumer<T> trigger) {
        try {
            CompletableFuture<Boolean> completableFuture = new CompletableFuture<Boolean>()
                    .orTimeout(registrationTimeout, MILLISECONDS);
            logger.info("Registering event handler on server.");
            getSocket().emit("registerWebhookEventHandler", new Object[]{Map.of("clientID", clientId,
                            "webhookHandleID", handleId,
                            "apiKey", tokenProvider.getToken())},
                    objects -> {
                        logger.debug("Received response from server.");
                        completableFuture.complete((boolean) Optional.ofNullable(objects[0]).orElse(FALSE));
                    });
            if (!completableFuture.get()) {
                throw new EventRegistrationException(event, handleId);
            }
            String eventKey = format("%s:%s", event, handleId);
            return new EmitterHandle(eventKey, getSocket().on(eventKey, objects -> {
                try {
                    logger.debug("Received event {} on handle {}.", event, handleId);
                    String input = objects[0].toString();
                    logger.debug("Parsing input to {}.", eventType);
                    T parsedInput = jsonParser.parseString(jsonParser.<EventMessage>parseString(input, EventMessage.class).getBody(), eventType);
                    logger.debug("Input parsed. Passing it to listener.");
                    trigger.accept(parsedInput);
                    logger.debug("Input dispatched.");
                } catch (JsonToObjectParsingException e) {
                    throw new WebsocketInputParsingException(eventType, e);
                }
            }));
        } catch (InterruptedException | ExecutionException e) {
            throw new EventRegistrationException(event, handleId, e);
        }
    }

    @Override
    public Handle registerAuthFunctionEventHandler(String id, Consumer<Object[]> trigger) {
        Handle handle = registerTrigger("", id, Object[].class, trigger);
        return handle;
    }


    @Override
    public void close() {
        socket.disconnect();
    }
}
