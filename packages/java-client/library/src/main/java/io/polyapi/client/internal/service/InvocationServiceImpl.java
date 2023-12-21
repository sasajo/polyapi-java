package io.polyapi.client.internal.service;

import io.polyapi.client.api.ApiFunctionResponse;
import io.polyapi.commons.api.http.HttpClient;
import io.polyapi.commons.api.json.JsonParser;
import io.polyapi.commons.api.service.PolyApiService;
import io.polyapi.commons.internal.http.DefaultHttpClient;
import io.polyapi.commons.internal.http.HardcodedTokenProvider;
import io.polyapi.commons.internal.json.JacksonJsonParser;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.lang.reflect.Type;
import java.util.HashMap;
import java.util.Map;

import static java.lang.String.format;

public class InvocationServiceImpl extends PolyApiService implements InvocationService {
  private static final Logger logger = LoggerFactory.getLogger(InvocationServiceImpl.class);

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
}
