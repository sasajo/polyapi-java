package io.polyapi.plugin.service;

import io.polyapi.plugin.model.function.PolyFunction;

public interface PolyFunctionService {

    String deploy(String type, PolyFunction polyFunction);
}
