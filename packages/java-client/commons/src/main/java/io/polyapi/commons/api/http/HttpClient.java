package io.polyapi.commons.api.http;

import io.polyapi.commons.internal.http.HttpRequestBuilder;

public interface HttpClient {

  HttpRequestBuilder prepareRequest(String host, Integer port, HttpMethod method, String relativePath);

  HttpRequestBuilder prepareAuthenticatedRequest(String host, Integer port, HttpMethod method, String relativePath);

  Response send(Request request);
}
