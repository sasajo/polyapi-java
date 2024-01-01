package io.polyapi.client.internal.service;

import io.polyapi.client.api.ApiFunctionResponse;
import io.polyapi.client.api.AuthTokenEventConsumer;
import io.polyapi.client.api.AuthTokenOptions;
import io.polyapi.client.api.GetAuthTokenResponse;
import io.polyapi.client.api.VariableInjectManager;
import io.polyapi.commons.api.error.PolyApiException;
import io.polyapi.commons.api.http.HttpClient;
import io.polyapi.commons.api.json.JsonParser;
import io.polyapi.commons.api.service.PolyApiService;
import io.polyapi.commons.internal.http.DefaultHttpClient;
import io.polyapi.commons.internal.http.HardcodedTokenProvider;
import io.polyapi.commons.internal.json.JacksonJsonParser;
import org.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.lang.reflect.Type;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.Timer;

import static java.lang.Boolean.FALSE;
import static java.lang.Boolean.TRUE;
import static java.lang.String.format;

public class InvocationServiceImpl extends PolyApiService implements InvocationService {
  private static final Logger logger = LoggerFactory.getLogger(InvocationServiceImpl.class);
  private final VariableInjectManager variableInjectManager;

  /**
   * Utility constructor that only receives the minimum data.
   *
   * @param host   The host URL for Poly.
   * @param port   The port to connect to.
   * @param apiKey The Bearer token that will authorize the use of this service.
   */
  public InvocationServiceImpl(String host, Integer port, String apiKey) {
    this(host, port, new DefaultHttpClient(new HardcodedTokenProvider(apiKey)), new JacksonJsonParser());
  }

  public InvocationServiceImpl(String host, Integer port, HttpClient client, JsonParser jsonParser) {
    super(host, port, client, jsonParser);
  }

  @Override
  public <T> T invokeServerFunction(String id, Map<String, Object> body, Type expectedResponseType) {
    return invokeFunction("server", id, body, expectedResponseType);
  }

  @Override
  public <T> ApiFunctionResponse<T> invokeApiFunction(String id, Map<String, Object> body, Type expectedResponseType) {
    return invokeFunction("API", id, body, expectedResponseType);
  }

  private <T> T invokeFunction(String type, String id, Map<String, Object> body, Type expectedResponseType) {
    logger.debug("Invoking Poly {} function with ID {}.", type, id);
    var result = super.<Map<String, Object>, T>post(format("/functions/%s/%s/execute", type.toLowerCase(), id), new HashMap<>(), new HashMap<>(), body, expectedResponseType);
    logger.debug("Function successfully executed. Returning result as {}.", expectedResponseType.getTypeName());
    return result;
  }

  @Override
  public <T> T getVariable(String id, Type expectedResponseType) {
    logger.debug("Retrieving variable of type {} with ID {}.", expectedResponseType.getTypeName(), id);
    return get(format("/variables/%s/value", id), new HashMap<>(), new HashMap<>(), expectedResponseType);
  }

  @Override
  public <T> void updateVariable(String id, T entity) {
    logger.debug("Updating variable with ID {}.", id);
    patch(format("/variables/%s/value", id), new HashMap<>(), new HashMap<>(), entity);
    logger.debug("Update successful.");
  }

  @Override
  public <T> T invokeAuthFunction(String id, Map<String, Object> body, Type type) {
    logger.debug(" Invoking auth function with ID {}", id);
    var options = Optional.ofNullable(body.get("options")).map(AuthTokenOptions.class::cast).orElseGet(AuthTokenOptions::new);
    var callbackUrl = options.getCallbackUrl();
    var autoCloseOnUrl = Optional.ofNullable(options.getAutoCloseOnUrl()).orElse(FALSE);
    var autoCloseOnToken = Optional.ofNullable(options.getAutoCloseOnToken()).orElse(TRUE);
    var timeout = Optional.ofNullable(options.getTimeout()).orElse(120_000);
    var eventsClientId = ClientInfo.CLIENT_ID;
    var timer = new Timer();

    try {
      var payload = new HashMap<>();
      payload.put("eventsClientId", variableInjectManager.getInjectedValueOrOriginal(eventsClientId));
      payload.put("clientId", variableInjectManager.getInjectedValueOrOriginal(body.get("clientID"));
      payload.put("clientSecret", variableInjectManager.getInjectedValueOrOriginal(body.get("clientSecret"));
      payload.put("scopes", body.get("scopes"));
      Optional.ofNullable(body.get("audience")).ifPresent(audience -> payload.put("audience", variableInjectManager.getInjectedValueOrOriginal(audience)));
      payload.put("userId", variableInjectManager.getInjectedValueOrOriginal(options.getUserId()));
      if (callbackUrl != null) {
        payload.put("callbackUrl", variableInjectManager.getInjectedValueOrOriginal(callbackUrl));
      }

      GetAuthTokenResponse data = post("/auth-providers/{{id}}/execute", new HashMap<>(), new HashMap<>() payload, GetAuthTokenResponse.class);
      AuthTokenEventConsumer callback = AuthTokenEventConsumer.class.cast(body.get("callback"));

      if (data.getToken() != null) {
        callback.accept(data.getToken(), data.getUrl(), null);
      } else {
        if (data.getUrl() != null && autoCloseOnUrl) {
          callback.accept(null, data.getUrl(), null);
        } else {

          webSocketClient.registerAuthFunctionEventHandler("{{id}}", (objects) -> {
            var eventData = (JSONObject) objects[0];
            try {
              var event = objectMapper.readValue(eventData.toString(), GetAuthTokenResponse.class);
              if (event.getToken() != null) {
                callback.accept(event.getToken(), event.getUrl(), event.getError());
                if (event.getToken() != null && autoCloseOnToken) {
                  webSocketClient.unregisterAuthFunctionEventHandler("{{id}}");
                }
              }
            } catch (Exception e) {
              throw new PolyRuntimeException(e);
            }
          });

          callback.accept(data.getToken(), data.getUrl(), data.getError());

          if (timeout > 0) {
            timer.schedule(new TimerTask() {
              @Override
              public void run() {
                try {
                  webSocketClient.unregisterAuthFunctionEventHandler("{{id}}");
                  callback.accept(null, null, "Timeout reached for auth function {{id}}");
                } catch (JSONException ex) {
                  throw new PolyRuntimeException(ex);
                }
              }
            }, timeout);
          }
        } catch(Exception e){
          // FIXME: Throw an appropriate exception.
          throw new PolyApiException(e);
        }
      }

    }

    return null;
  }
}
