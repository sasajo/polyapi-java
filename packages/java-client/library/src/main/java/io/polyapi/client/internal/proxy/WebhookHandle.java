package io.polyapi.client.internal.proxy;

import io.polyapi.client.api.model.websocket.WebhookEventConsumer;
import io.polyapi.client.internal.websocket.WebSocketClient;
import io.polyapi.commons.api.json.JsonParser;
import io.socket.emitter.Emitter;

import java.lang.reflect.Type;

import static com.fasterxml.jackson.databind.type.TypeFactory.defaultInstance;

public class WebhookHandle {
  private final WebSocketClient client;
  private final JsonParser jsonParser;

  public WebhookHandle(JsonParser jsonParser, WebSocketClient client) {
    this.jsonParser = jsonParser;
    this.client = client;
  }

  protected void registerEventHandler(String handleId, Type type, WebhookEventConsumer<?> callback) {
    client.registerWebhookEventHandler(handleId, new PolyListener<>(type, jsonParser, callback));
  }
}