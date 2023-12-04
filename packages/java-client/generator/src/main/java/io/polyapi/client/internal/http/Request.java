package io.polyapi.client.internal.http;

import java.io.InputStream;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import static java.lang.String.format;

public interface Request {
  String host();

  Integer port();

  String relativePath();

  Map<String, List<String>> queryParams();

  default String getUrl() {
    return format("%s:%s/%s?%s",
      host(),
      port(),
      relativePath(),
      queryParams().entrySet().stream()
        .map(entry -> entry.getValue().stream()
          .map(subEntry -> format("%s=%s", entry.getKey(), subEntry))
          .collect(Collectors.joining("&"))));
  }

  Map<String, List<String>> headers();

  InputStream body();

  HttpMethod method();
}
