package io.polyapi.plugin.service;

import io.polyapi.plugin.model.ServerVariable;

public interface ServerVariableService {

    ServerVariable create(String name, String description, Object value, boolean secret, String context);
}
