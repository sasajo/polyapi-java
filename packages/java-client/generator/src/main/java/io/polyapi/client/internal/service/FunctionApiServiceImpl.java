package io.polyapi.client.internal.service;

import io.polyapi.client.internal.http.HttpClient;
import io.polyapi.client.internal.parse.JsonParser;
import io.polyapi.client.model.function.PolyFunction;

import java.util.HashMap;

public class FunctionApiServiceImpl extends PolyApiService implements FunctionApiService {

  public FunctionApiServiceImpl(String host, Integer port, HttpClient client, JsonParser jsonParser) {
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
