package io.polyapi.client.internal.model;

import io.polyapi.client.api.model.variable.ServerVariable;
import io.polyapi.client.internal.proxy.PolyProxyFactory;
import io.polyapi.client.api.model.function.PolyApiFunction;
import io.polyapi.client.api.model.function.server.PolyServerFunction;
import io.polyapi.client.internal.proxy.WebhookHandle;
import io.polyapi.client.internal.proxy.WebhookHandlerFactory;
import io.polyapi.client.internal.service.InvocationServiceImpl;
import io.polyapi.client.internal.websocket.WebSocketClient;
import io.polyapi.commons.api.error.PolyApiException;
import io.polyapi.commons.api.json.JsonParser;
import io.polyapi.commons.internal.http.DefaultHttpClient;
import io.polyapi.commons.internal.http.HardcodedTokenProvider;
import io.polyapi.commons.internal.json.JacksonJsonParser;

import java.io.IOException;
import java.lang.reflect.InvocationTargetException;
import java.util.Optional;
import java.util.Properties;

public class PolyContext {
  private final PolyProxyFactory proxyFactory;
  private final WebhookHandlerFactory webhookHandlerFactory;

  public PolyContext() {
    this(Optional.of(new Properties())
      .map(properties -> {
        try {
          properties.load(PolyContext.class.getResourceAsStream("poly.properties"));
          return new PolyContextConfiguration(properties.getProperty("io.polyapi.host"), Integer.valueOf(properties.getProperty("io.polyapi.port")), properties.getProperty("io.polyapi.api.key"), properties.getProperty("io.polyapi.api.client.id"));
        } catch (IOException e) {
          throw new PolyApiException(e);
        }
      }).orElseThrow(PolyApiException::new), new JacksonJsonParser());
  }

  public PolyContext(PolyContextConfiguration config, JsonParser jsonParser) {
    this(new PolyProxyFactory(new InvocationServiceImpl(config.host(), config.port(), new DefaultHttpClient(new HardcodedTokenProvider(config.apiKey())), jsonParser)), new WebhookHandlerFactory(new WebSocketClient(config.host(), config.port(), config.clientId(), new HardcodedTokenProvider(config.apiKey())), jsonParser));
  }

  public PolyContext(PolyProxyFactory proxyFactory, WebhookHandlerFactory webhookHandlerFactory) {
    this.proxyFactory = proxyFactory;
    this.webhookHandlerFactory = webhookHandlerFactory;
  }

  protected <T extends PolyServerFunction> T createServerFunctionProxy(Class<T> polyInterface) {
    return proxyFactory.createServerFunctionProxy(polyInterface);
  }

  protected <T extends PolyApiFunction> T createApiFunctionProxy(Class<T> polyInterface) {
    return proxyFactory.createApiFunctionProxy(polyInterface);
  }

  protected <T extends ServerVariable> T createServerVariableProxy(Class<T> polyInterface) {
    return proxyFactory.createServerVariableProxy(polyInterface);
  }

  protected <T extends WebhookHandle> T createWebhookHandle(Class<T> polyInterface) {
    return webhookHandlerFactory.create(polyInterface);
  }

  protected <T extends PolyContext> T createSubContext(Class<T> polyContextType) {
    try {
      return polyContextType.getDeclaredConstructor(PolyProxyFactory.class, WebhookHandlerFactory.class).newInstance(proxyFactory, webhookHandlerFactory);
    } catch (InstantiationException | IllegalAccessException | InvocationTargetException | NoSuchMethodException e) {
      // FIXME: Throw appropriate exception.
      throw new PolyApiException(e);
    }
  }
}
