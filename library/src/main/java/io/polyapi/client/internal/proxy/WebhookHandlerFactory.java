package io.polyapi.client.internal.proxy;

import io.polyapi.client.internal.websocket.WebSocketClient;
import io.polyapi.commons.api.error.PolyApiException;
import io.polyapi.commons.api.json.JsonParser;

import java.lang.reflect.InvocationTargetException;

public class WebhookHandlerFactory {
  private final JsonParser jsonParser;
  private final WebSocketClient webSocketClient;

  public WebhookHandlerFactory(WebSocketClient webSocketClient, JsonParser jsonParser) {
    this.jsonParser = jsonParser;
    this.webSocketClient = webSocketClient;
  }

  public <T extends WebhookHandle> T create(Class<T> type) {
    try {
      return type.getDeclaredConstructor(JsonParser.class, WebSocketClient.class).newInstance(jsonParser, webSocketClient);
    } catch (InstantiationException | IllegalAccessException | InvocationTargetException | NoSuchMethodException e) {
      // FIXME: Throw appropriate exception.
      throw new PolyApiException(e);
    }
  }
}
