package io.polyapi.plugin.service;

import io.polyapi.plugin.model.function.PolyFunction;

public interface PolyFunctionService {

    PolyFunction deploy(String type, PolyFunction polyFunction);

    void delete(String context, String name);

    void delete(String id);
}
