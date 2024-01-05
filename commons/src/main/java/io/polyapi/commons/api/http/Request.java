package io.polyapi.commons.api.http;

import java.io.InputStream;
import java.util.List;
import java.util.Map;

import static java.lang.String.format;
import static java.util.stream.Collectors.joining;

public interface Request {
  String host();

  Integer port();

  String relativePath();

  Map<String, List<String>> queryParams();

  default String getUrl() {
    return format("%s:%s/%s%s%s",
      host(),
      port(),
      relativePath(),
      queryParams().entrySet().isEmpty() ? "" : "?",
      queryParams().entrySet().stream()
        .map(entry -> entry.getValue().stream()
          .map(subEntry -> format("%s=%s", entry.getKey(), subEntry))
          .collect(joining("&")))
        .collect(joining("&")));
  }

  Map<String, List<String>> headers();

  InputStream body();

  HttpMethod method();
}
