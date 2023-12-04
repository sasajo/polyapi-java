package io.polyapi.client.internal.http;

public interface HttpClient {

  HttpRequestBuilder prepareRequest(String host, Integer port, HttpMethod method, String relativePath);

  HttpRequestBuilder prepareAuthenticatedRequest(String host, Integer port, HttpMethod method, String relativePath);

  Response send(Request request);
}
