package io.polyapi.plugin.service;

import io.polyapi.commons.api.http.HttpClient;
import io.polyapi.commons.api.json.JsonParser;
import io.polyapi.plugin.model.function.PolyFunction;
import io.polyapi.commons.api.service.PolyApiService;

import java.util.HashMap;

public class PolyFunctionServiceImpl extends PolyApiService implements PolyFunctionService {

  public PolyFunctionServiceImpl(String host, Integer port, HttpClient client, JsonParser jsonParser) {
    super(host, port, client, jsonParser);
  }

  @Override
  public PolyFunction postCustomServerFunction(PolyFunction polyFunction) {
    return post("functions/server", new HashMap<>(), new HashMap<>(), polyFunction, PolyFunction.class);
  }

  @Override
  public PolyFunction postCustomClientFunction(PolyFunction polyFunction) {
    return post("functions/client", new HashMap<>(), new HashMap<>(), polyFunction, PolyFunction.class);
  }
}
