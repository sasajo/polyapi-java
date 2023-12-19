package io.polyapi.client.internal.service;

import java.util.Map;

public interface PolyFunctionLibraryService {

  <T> T invokeServerFunction(String id, Map<String, Object> body, Class<T> expectedResponseType);
}
