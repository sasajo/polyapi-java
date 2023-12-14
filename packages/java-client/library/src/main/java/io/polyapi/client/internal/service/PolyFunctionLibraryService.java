package io.polyapi.client.internal.service;

import io.polyapi.commons.api.model.PolyObject;
import io.polyapi.commons.api.model.function.PolyFunction;

import java.lang.reflect.Parameter;
import java.lang.reflect.Type;
import java.util.Map;

public interface PolyFunctionLibraryService {

  <T> T invokeServerFunction(String id, Map<String, Object> body, Class<T> expectedResponseType);
}
