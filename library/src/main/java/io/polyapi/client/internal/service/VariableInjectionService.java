package io.polyapi.client.internal.service;

public interface VariableInjectionService {
    Object replace(String propertyName, Object original);

    <T> T inject(String key, String type);
}
