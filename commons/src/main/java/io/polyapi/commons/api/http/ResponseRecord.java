package io.polyapi.commons.api.http;

import java.io.InputStream;
import java.util.List;
import java.util.Map;

public record ResponseRecord(Map<String, List<String>> headers, InputStream body, Integer statusCode) implements Response {
}
