package io.polyapi.client.internal.service;

public record ServerVariableKeyRecord(Object key, String id) {
    public boolean match(Object object) {
        return key == object;
    }
}
