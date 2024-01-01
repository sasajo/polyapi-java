package io.polyapi.client.api.model.function.auth;

import io.polyapi.client.api.AuthTokenEventConsumer;
import io.polyapi.client.api.AuthTokenOptions;

public interface TokenAuthFunction extends AuthFunction {

  default void getToken(String clientID, String clientSecret, String[] scopes, AuthTokenEventConsumer callback) {
    getToken(clientID, clientSecret, scopes, callback, null);
  }
  void getToken(String clientID, String clientSecret, String[] scopes, AuthTokenEventConsumer callback, AuthTokenOptions options);
}
