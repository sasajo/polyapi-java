package io.polyapi.client.api.model.function;

import io.polyapi.client.api.AuthTokenEventConsumer;
import io.polyapi.client.api.AuthTokenOptions;

public interface TokenAuthFunction extends AuthFunction {

  default void getToken(String clientId, String clientSecret, String[] scopes, AuthTokenEventConsumer callback) {
    getToken(clientId, clientSecret, scopes, callback, null);
  }
  void getToken(String clientId, String clientSecret, String[] scopes, AuthTokenEventConsumer callback, AuthTokenOptions options);
}
