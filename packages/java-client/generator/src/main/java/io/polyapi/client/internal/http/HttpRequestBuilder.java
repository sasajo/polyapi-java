package io.polyapi.client.internal.http;

import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.function.BiConsumer;

import static java.nio.charset.Charset.defaultCharset;

/**
 * Utility class for the creation of {@link Request}s.
 */
public class HttpRequestBuilder {
  private final Request request;

  private HttpRequestBuilder(Request request) {
    this.request = request;
  }

  private HttpRequestBuilder(HttpRequestBuilder builder, String relativePath, Map<String, List<String>> queryParams, Map<String, List<String>> headers, InputStream body) {
    this(new RequestRecord(builder.request.host(), relativePath, builder.request.port(), queryParams, builder.request.method(), headers, body));
  }

  public HttpRequestBuilder(String host, Integer port, HttpMethod method, String relativePath) {
    this(new RequestRecord(host, relativePath, port, new HashMap<>(), method, new HashMap<>(), InputStream.nullInputStream()));
  }


  public HttpRequestBuilder withHeader(String name, String value) {
    return withHeaders(Map.of(name, List.of(value)));
  }

  public HttpRequestBuilder withHeaders(Map<String, List<String>> headers) {
    return new HttpRequestBuilder(this, request.relativePath(), request.queryParams(), merge(request.headers(), headers), request.body());
  }

  public HttpRequestBuilder withQueryParam(String name, String value) {
    return withQueryParams(Map.of(name, List.of(value)));
  }

  public HttpRequestBuilder withQueryParams(Map<String, List<String>> queryParams) {
    return new HttpRequestBuilder(this, request.relativePath(), merge(request.queryParams(), queryParams), request.headers(), request.body());
  }

  public HttpRequestBuilder withBody(String body) {
    return withBody(new ByteArrayInputStream(body.getBytes(defaultCharset())));
  }

  public HttpRequestBuilder withBody(InputStream body) {
    return new HttpRequestBuilder(this, request.relativePath(), request.queryParams(), request.headers(), body);
  }

  public Request build() {
    return request;
  }

  /**
   * Inner method that creates a new {@link Map}{@literal <}{@link String}/{@link List}{@literal <}{@link String}{@literal >}{@literal >} from 2 different instances.
   * Merges the lists in the values. This is made in a new instance to avoid changes in any of the parameters to affect the result.
   *
   * @param map1 The first map to be added into the result.
   * @param map2 The second map to be added into the result.
   * @return {@link Map} The new merged map.
   */
  private Map<String, List<String>> merge(Map<String, List<String>> map1, Map<String, List<String>> map2) {
    Map<String, List<String>> result = new HashMap<>();
    BiConsumer<String, List<String>> merger = (key, list) -> {
      if (!result.containsKey(key)) {
        result.put(key, new ArrayList<>());
      }
      result.get(key).addAll(list);
    };
    map1.forEach(merger);
    map2.forEach(merger);
    return result;
  }
}
