package io.polyapi.client.internal.model;

import io.polyapi.commons.api.http.TokenProvider;

public record PolyContextConfiguration(String host, Integer port, String apiKey, String clientId) {
}
