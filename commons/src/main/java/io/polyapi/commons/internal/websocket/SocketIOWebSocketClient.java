package io.polyapi.commons.internal.websocket;

import static java.lang.Boolean.FALSE;
import static java.lang.String.format;
import static java.util.concurrent.TimeUnit.MILLISECONDS;

import java.lang.reflect.Type;
import java.net.URI;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutionException;

import io.polyapi.commons.api.error.parse.JsonToObjectParsingException;
import io.polyapi.commons.api.error.websocket.EventRegistrationException;
import io.polyapi.commons.api.error.websocket.WebsocketInputParsingException;
import io.polyapi.commons.api.http.TokenProvider;
import io.polyapi.commons.api.json.JsonParser;
import io.polyapi.commons.api.model.PolyEventConsumer;
import io.polyapi.commons.api.websocket.Handle;
import io.polyapi.commons.api.websocket.WebSocketClient;
import io.socket.client.IO;
import io.socket.client.Socket;
import lombok.extern.slf4j.Slf4j;

@Slf4j
public class SocketIOWebSocketClient implements WebSocketClient {
    private final String url;
    private final TokenProvider tokenProvider;
    private final String clientId;
    private final Long registrationTimeout;
    private final JsonParser jsonParser;
    private Socket socket;

    public SocketIOWebSocketClient(String url, String clientId, TokenProvider tokenProvider, JsonParser jsonParser,
            Long registrationTimeout) {
        this.clientId = clientId;
        this.url = url;
        this.tokenProvider = tokenProvider;
        this.jsonParser = jsonParser;
        this.registrationTimeout = registrationTimeout;

    }

    private synchronized Socket getSocket() {
        if (this.socket == null) {
            this.socket = IO.socket(URI.create(format("%s/events", url)), IO.Options.builder()
                    .setTransports(new String[] { "websocket" })
                    .build())
                    .connect();
        }
        return socket;
    }

    public <T> Handle registerTrigger(String event, String handleId, Type eventType, PolyEventConsumer<T> trigger) {
        try {
            CompletableFuture<Boolean> completableFuture = new CompletableFuture<Boolean>()
                    .orTimeout(registrationTimeout, MILLISECONDS);
            log.info("Registering event handler on server.");
            getSocket().emit("registerWebhookEventHandler", new Object[] { Map.of("clientID", clientId,
                    "webhookHandleID", handleId,
                    "apiKey", tokenProvider.getToken()) },
                    objects -> {
                        log.debug("Received response from server.");
                        completableFuture.complete((boolean) Optional.ofNullable(objects[0]).orElse(FALSE));
                    });
            if (FALSE.equals(completableFuture.get())) {
                throw new EventRegistrationException(event, handleId);
            }
            String eventKey = format("%s:%s", event, handleId);
            return new EmitterHandle(eventKey, getSocket().on(eventKey, objects -> {
                try {
                    log.debug("Received event {} on handle {}.", event, handleId);
                    EventMessage message = jsonParser.parseString(objects[0].toString(), EventMessage.class);
                    log.debug("Parsing payload to {}.", eventType);
                    T parsedInput = jsonParser.parseString(message.getBody(), eventType);
                    log.debug("Input parsed. Passing it to listener.");
                    trigger.accept(parsedInput, message.getHeaders(), message.getParams());
                    log.debug("Input dispatched.");
                } catch (JsonToObjectParsingException e) {
                    throw new WebsocketInputParsingException(eventType, e);
                }
            }));
        } catch (InterruptedException | ExecutionException e) {
            throw new EventRegistrationException(event, handleId, e);
        }
    }

    @Override
    public <T> Handle registerAuthFunctionEventHandler(String id, PolyEventConsumer<T> trigger) {
        return registerTrigger("", id, Object[].class, trigger);
    }

    @Override
    public void close() {
        socket.disconnect();
    }
}
