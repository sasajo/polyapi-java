package io.polyapi.client.internal.service;

import io.polyapi.client.model.function.PolyFunction;

public interface FunctionApiService {

  PolyFunction postCustomServerFunction(PolyFunction polyFunction);

  PolyFunction postCustomClientFunction(PolyFunction polyFunction);
}
