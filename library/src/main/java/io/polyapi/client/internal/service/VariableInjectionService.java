package io.polyapi.client.internal.service;

public interface VariableInjectionService {
    Object replace(String propertyName, Object original);

    void put(Object key, Object value);
}
