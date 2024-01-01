package io.polyapi.client.internal.service;

import io.polyapi.client.api.ApiFunctionResponse;
import io.polyapi.client.api.VariableUpdateResponse;

import java.lang.reflect.Type;
import java.util.Map;

public interface InvocationService {

  <T> T invokeServerFunction(String id, Map<String, Object> body, Type expectedResponseType);

  <T> ApiFunctionResponse<T> invokeApiFunction(String id, Map<String, Object> body, Type expectedResponseType);

  <T> T getVariable(String id, Type type);

  <T> void updateVariable(String id, T entity);

  <T> T invokeAuthFunction(String id, Map<String, Object>body, Type type);
}
