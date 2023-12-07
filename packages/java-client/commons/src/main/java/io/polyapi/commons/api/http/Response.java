package io.polyapi.commons.api.http;

import java.io.InputStream;
import java.util.List;
import java.util.Map;

public interface Response {
  Map<String, List<String>> headers();
  InputStream body();
  Integer statusCode();
}
