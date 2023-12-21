package io.polyapi.client.internal.proxy;

import io.polyapi.commons.api.model.PolyObject;

import java.util.Map;

public record Event<T>(T body, Map<String, String> headers, Map<String, String> params)  implements PolyObject {
}
