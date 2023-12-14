package io.polyapi.client.internal.service;

import io.polyapi.commons.api.http.HttpClient;
import io.polyapi.commons.api.json.JsonParser;
import io.polyapi.commons.api.service.PolyApiService;
import io.polyapi.commons.internal.http.DefaultHttpClient;
import io.polyapi.commons.internal.json.JacksonJsonParser;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.HashMap;
import java.util.Map;

import static java.lang.String.format;

public class PolyFunctionLibraryServiceImpl extends PolyApiService implements PolyFunctionLibraryService {
  private static final Logger logger = LoggerFactory.getLogger(PolyFunctionLibraryServiceImpl.class);

  /**
   * Utility constructor that only receives the minimum data.
   *
   * @param host   The host URL for Poly.
   * @param port   The port to connect to.
   * @param apiKey The Bearer token that will authorize the use of this service.
   */
  public PolyFunctionLibraryServiceImpl(String host, Integer port, String apiKey) {
    this(host, port, new DefaultHttpClient(apiKey), new JacksonJsonParser());
  }

  public PolyFunctionLibraryServiceImpl(String host, Integer port, HttpClient client, JsonParser jsonParser) {
    super(host, port, client, jsonParser);
  }

  @Override
  public <T> T invokeServerFunction(String id, Map<String, Object> body, Class<T> expectedResponseType) {
    logger.debug("Invoking Poly server function with ID {}.", id);
    var result = super.<Map<String, Object>, T>post(format("/functions/server/%s/execute", id), new HashMap<>(), new HashMap<>(), body, expectedResponseType);
    logger.debug("Function successfully executed. Returning result as {}.", expectedResponseType.getName());
    return result;
  }
}
