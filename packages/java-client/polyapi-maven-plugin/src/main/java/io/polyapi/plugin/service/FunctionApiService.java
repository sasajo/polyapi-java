package io.polyapi.plugin.service;

import io.polyapi.commons.api.model.function.PolyFunction;

public interface FunctionApiService {

  PolyFunction postCustomServerFunction(PolyFunction polyFunction);

  PolyFunction postCustomClientFunction(PolyFunction polyFunction);
}
