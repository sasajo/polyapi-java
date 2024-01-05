package io.polyapi.client.internal.proxy;

import io.polyapi.client.api.model.websocket.WebhookEventConsumer;
import io.polyapi.commons.api.json.JsonParser;
import io.socket.emitter.Emitter;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.lang.reflect.Type;

import static com.fasterxml.jackson.databind.type.TypeFactory.defaultInstance;

public class PolyListener<T> implements Emitter.Listener {
  private static final Logger logger = LoggerFactory.getLogger(PolyListener.class);
  private final WebhookEventConsumer<T> callback;
  private final JsonParser jsonParser;
  private final Type type;

  public PolyListener(Type type, JsonParser jsonParser, WebhookEventConsumer<T> callback) {
    this.type = type;
    this.jsonParser = jsonParser;
    this.callback = callback;
  }

  @Override
  public void call(Object... objects) {
    logger.info("Received event.");
    String jsonInput = objects[0].toString();
    logger.trace("JSon event contents:\n{}", jsonInput);
    Event<T> event = jsonParser.parseString(jsonInput, defaultInstance().constructParametricType(Event.class, defaultInstance().constructType(type)));
    logger.debug("Trigger listener.");
    callback.accept(event.body(), event.headers(), event.params());
  }
}