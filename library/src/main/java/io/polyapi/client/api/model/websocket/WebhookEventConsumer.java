package io.polyapi.client.api.model.websocket;

import java.util.Map;

@FunctionalInterface
public interface WebhookEventConsumer<E> {
  void accept(E event, Map<String, String> headers, Map<String, String> params);
}
