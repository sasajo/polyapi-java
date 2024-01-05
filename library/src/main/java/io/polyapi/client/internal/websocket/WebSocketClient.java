package io.polyapi.client.internal.websocket;

import io.polyapi.client.api.ClientInfo;
import io.polyapi.client.api.OnUpdateListener;
import io.polyapi.client.api.OnUpdateOptions;
import io.polyapi.commons.api.http.TokenProvider;
import io.socket.client.IO;
import io.socket.client.Socket;
import io.socket.emitter.Emitter;
import org.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.net.URISyntaxException;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

import static io.socket.client.Socket.EVENT_CONNECT;
import static java.lang.String.format;

public class WebSocketClient {
  private static final Logger logger = LoggerFactory.getLogger(WebSocketClient.class);

  // FIXME: Remove this.
  private static final String URL = ClientInfo.API_BASE_URL + "/events";
  private final String host;
  private final String clientId;
  private final TokenProvider tokenProvider;
  private final Integer port;
  private Socket socket;

  public WebSocketClient(String host, Integer port, String clientId, TokenProvider tokenProvider) {
    this.host = host;
    this.port = port;
    this.clientId = clientId;
    this.tokenProvider = tokenProvider;
  }

  private Socket getSocket() {
    if (socket == null || !socket.connected()) {
      try {
        socket = IO.socket(format("%s%s",
          host,
          Optional.ofNullable(port)
            .map(String::valueOf)
            .map(":"::concat)
            .orElse("")));
        socket.on(EVENT_CONNECT, args -> logger.debug("Socket connected."));
        socket.connect();
      } catch (URISyntaxException | RuntimeException e) {
        // FIXME: We shoudl throw an exception here.
        e.printStackTrace();
      }
    }
    return socket;
  }

  private JSONObject createJsonObject(Map<String, Object> arguments) {
    var jsonObject = new HashMap<>(arguments);
    jsonObject.put("clientID", clientId);
    jsonObject.put("apiKey", tokenProvider.getToken());
    return new JSONObject(jsonObject);
  }

  private void emit(String event, Map<String, Object> arguments, String ackEventType, String ackEventId, Emitter.Listener callback) {
    getSocket().emit(event, createJsonObject(arguments), new Acknowledge(getSocket(), ackEventType, ackEventId, callback));
  }

  private void emit(String event, Map<String, Object> arguments) {
    getSocket().emit(event, createJsonObject(arguments));
  }

  private void off(String eventName, String id) {
    getSocket().off(format("%s:%s", eventName, id));
  }

  public void registerWebhookEventHandler(String handleId, Emitter.Listener callback) {
    emit("registerWebhookEventHandler", Map.of("webhookHandleID", handleId), "handleWebhookEvent", handleId, callback);
  }

  public OnUpdateListener registerOnUpdateVariableEventHandler(String variableID, Emitter.Listener callback) {
    Map<String, Object> arguments = Map.of("variableId", variableID);
    emit("registerVariableChangeEventHandler", arguments, "handleVariableChangeEvent", variableID, callback);

    return () -> {
      off("handleVariableChangeEvent", variableID);
      emit("unregisterVariableChangeEventHandler", arguments);
    };
  }

  public OnUpdateListener registerOnUpdateVariablesEventHandler(String path, OnUpdateOptions options, Emitter.Listener callback) {
    Map<String, Object> arguments = Map.of("path", path, "options", new JSONObject(options));
    emit("registerVariablesChangeEventHandler", arguments, "handleVariablesChangeEvent", path, callback);
    return () -> {
      off("handleVariablesChangeEvent", path);
      emit("unregisterVariablesChangeEventHandler", arguments);
    };
  }

  public void registerAuthFunctionEventHandler(String id, Emitter.Listener callback) {
    emit("registerAuthFunctionEventHandler", Map.of("functionId", id), "handleAuthFunctionEvent", id, callback);
  }

  public void unregisterAuthFunctionEventHandler(String id) {
    off("handleAuthFunctionEvent", id);
    emit("unregisterAuthFunctionEventHandler", Map.of("functionId", id));
  }

  public void disconnect() {
    Optional.ofNullable(socket).ifPresent(Socket::disconnect);
  }
}
