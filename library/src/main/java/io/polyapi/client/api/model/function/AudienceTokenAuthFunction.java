package io.polyapi.client.api.model.function;

import io.polyapi.client.api.AuthTokenEventConsumer;
import io.polyapi.client.api.AuthTokenOptions;

public interface AudienceTokenAuthFunction extends AuthFunction {
  default void getToken(String clientId, String clientSecret, String audience, String[] scopes, AuthTokenEventConsumer callback) {
    getToken(clientId, clientSecret, audience, scopes, callback, null);
  }
  void getToken(String clientId, String clientSecret, String audience, String[] scopes, AuthTokenEventConsumer callback, AuthTokenOptions options);
}
