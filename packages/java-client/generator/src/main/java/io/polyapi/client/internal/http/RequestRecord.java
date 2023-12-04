package io.polyapi.client.internal.http;

import java.io.InputStream;
import java.util.List;
import java.util.Map;

public record RequestRecord(String host, String relativePath, Integer port, Map<String, List<String>> queryParams, HttpMethod method, Map<String, List<String>> headers, InputStream body) implements Request {
}
