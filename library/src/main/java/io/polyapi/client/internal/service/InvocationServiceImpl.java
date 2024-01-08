package io.polyapi.client.internal.service;

import io.polyapi.client.api.ApiFunctionResponse;
import io.polyapi.client.api.AuthTokenEventConsumer;
import io.polyapi.client.api.AuthTokenOptions;
import io.polyapi.client.api.GetAuthTokenResponse;
import io.polyapi.client.api.VariableInjectManager;
import io.polyapi.client.api.model.function.auth.PolyAuthSubresource;
import io.polyapi.client.internal.websocket.WebSocketClient;
import io.polyapi.commons.api.error.PolyApiException;
import io.polyapi.commons.api.http.HttpClient;
import io.polyapi.commons.api.json.JsonParser;
import io.polyapi.commons.api.service.PolyApiService;
import io.polyapi.commons.internal.http.DefaultHttpClient;
import io.polyapi.commons.internal.http.HardcodedTokenProvider;
import io.polyapi.commons.internal.json.JacksonJsonParser;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.lang.reflect.Type;
import java.util.Map;
import java.util.Optional;
import java.util.Timer;
import java.util.TimerTask;
import java.util.stream.Collectors;

import static java.lang.String.format;

public class InvocationServiceImpl extends PolyApiService implements InvocationService {
    private static final Logger logger = LoggerFactory.getLogger(InvocationServiceImpl.class);
    private final WebSocketClient webSocketClient;
    private final String clientId;
    private final JsonParser jsonParser;

    public InvocationServiceImpl(String host, Integer port, String clientId, HttpClient client, JsonParser jsonParser, WebSocketClient webSocketClient) {
        super(host, port, client, jsonParser);
        this.clientId = clientId;
        this.jsonParser = jsonParser;
        this.webSocketClient = webSocketClient;
    }

    @Override
    public <T> T invokeServerFunction(Class<?> invokingClass, String id, Map<String, Object> body, Type expectedResponseType) {
        return invokeFunction("server", id, body, expectedResponseType);
    }

    @Override
    public <T> ApiFunctionResponse<T> invokeApiFunction(Class<?> invokingClass, String id, Map<String, Object> body, Type expectedResponseType) {
        return invokeFunction("API", id, body, expectedResponseType);
    }

    @Override
    public <T> T invokeCustomFunction(Class<?> invokingClass, String id, Map<String, Object> body, Type expectedResponseType) {
        try {
            Class.forName(format("%sDelegate", invokingClass.getName()));
        } catch (ClassNotFoundException e) {
            // FIXME: Throw the appropriate exception.
            throw new PolyApiException(e);
        }
        return null;
    }

    @Override
    public Void invokeAuthFunction(Class<?> invokingClass, String id, Map<String, Object> body, Type expectedResponseType) {
        try {
            AuthTokenEventConsumer callback = AuthTokenEventConsumer.class.cast(body.remove("callback"));
            AuthTokenOptions options = AuthTokenOptions.class.cast(body.remove("options"));
            body.put("eventsClientId", clientId);
            Optional.ofNullable(options).ifPresent(presentOptions -> {
                body.put("userId", options.getUserId());
                body.put("callbackUrl", options.getCallbackUrl());
            });
            var variableInjectManager = VariableInjectManager.getInstance();
            Optional<AuthTokenOptions> optionalOptions = Optional.ofNullable(options);
            GetAuthTokenResponse data = post(format("auth-providers/%s/execute", id), body.entrySet().stream()
                    .filter(entry -> entry.getValue() != null)
                    .collect(Collectors.toMap(Map.Entry::getKey, entry -> variableInjectManager.getInjectedValueOrOriginal(entry.getValue()))), GetAuthTokenResponse.class);
            if (data.getToken() == null) {
                if (data.getUrl() == null || !optionalOptions.map(AuthTokenOptions::getAutoCloseOnUrl).orElse(false)) {
                    webSocketClient.registerAuthFunctionEventHandler(id, objects -> {
                        try {
                            GetAuthTokenResponse event = jsonParser.parseString(objects[0].toString(), GetAuthTokenResponse.class);
                            if (event.getToken() != null) {
                                callback.accept(event.getToken(), event.getUrl(), event.getError());
                                if (optionalOptions.map(AuthTokenOptions::getAutoCloseOnToken).orElse(true)) {
                                    webSocketClient.unregisterAuthFunctionEventHandler(id);
                                }
                            }
                        } catch (RuntimeException e) {
                            throw new PolyApiException(e);
                        }
                    });
                    callback.accept(data.getToken(), data.getUrl(), data.getError());

                    // FIXME: This will always unregister the event handler and indicate that the timeout has been reached.
                    var timeout = optionalOptions.map(AuthTokenOptions::getTimeout).orElse(120_000);
                    if (timeout > 0) {
                        new Timer().schedule(new TimerTask() {
                            @Override
                            public void run() {
                                webSocketClient.unregisterAuthFunctionEventHandler(id);
                                callback.accept(null, null, format("Timeout reached for auth function %s.", id));
                            }
                        }, timeout);
                    }
                } else {
                    callback.accept(null, data.getUrl(), null);
                }
            } else {
                callback.accept(data.getToken(), data.getUrl(), null);
            }
            return null;
        } catch (RuntimeException e) {
            // FIXME: Throw the appropriate exception.
            throw new PolyApiException(e);
        }
    }


    private <T> T invokeFunction(String type, String id, Map<String, Object> body, Type expectedResponseType) {
        logger.debug("Invoking Poly {} function with ID {}.", type, id);
        var result = super.<Map<String, Object>, T>post(format("functions/%s/%s/execute", type.toLowerCase(), id), body, expectedResponseType);
        logger.debug("Function successfully executed. Returning result as {}.", expectedResponseType.getTypeName());
        return result;
    }

    @Override
    public <T> T getVariable(String id, Type expectedResponseType) {
        logger.debug("Retrieving variable of type {} with ID {}.", expectedResponseType.getTypeName(), id);
        return get(format("variables/%s/value", id), expectedResponseType);
    }

    @Override
    public <T> void updateVariable(String id, T entity) {
        logger.debug("Updating variable with ID {}.", id);
        patch(format("variables/%s/value", id), entity);
        logger.debug("Update successful.");
    }

    @Override
    public Void invokeSubresourceAuthFunction(Class<?> invokingClass, String id, Map<String, Object> body, Type expectedResponseType) {
        body.put("clientID", clientId);
        post(format("auth-providers/%s/%s", id, invokingClass.getDeclaredAnnotation(PolyAuthSubresource.class).value()), body, expectedResponseType);
        return null;
    }
}
