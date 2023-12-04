package io.polyapi.client.internal.service;

import io.polyapi.client.internal.http.HttpClient;
import io.polyapi.client.internal.http.HttpMethod;
import io.polyapi.client.internal.http.HttpRequestBuilder;

public interface ApiCallStrategy {
  HttpRequestBuilder createBuilder(HttpClient client, String host, Integer port, String relativePath);
}
