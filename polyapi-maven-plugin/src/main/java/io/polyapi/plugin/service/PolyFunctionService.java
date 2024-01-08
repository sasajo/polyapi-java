package io.polyapi.plugin.service;

import io.polyapi.plugin.model.function.PolyFunction;

public interface PolyFunctionService {

    PolyFunction postServerFunction(PolyFunction polyFunction);

    PolyFunction postClientFunction(PolyFunction polyFunction);
}
