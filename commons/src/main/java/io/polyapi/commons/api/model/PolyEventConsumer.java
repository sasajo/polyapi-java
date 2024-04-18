package io.polyapi.commons.api.model;

import java.util.Map;

public interface PolyEventConsumer<T> {
    void accept(T event, Map<String, String> headers, Map<String, Object> params);
}
