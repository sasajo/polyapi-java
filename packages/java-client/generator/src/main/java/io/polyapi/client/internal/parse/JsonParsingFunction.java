package io.polyapi.client.internal.parse;

import com.fasterxml.jackson.core.JsonProcessingException;

@FunctionalInterface
public interface JsonParsingFunction<T, F> {
  T parse(F object) throws JsonProcessingException;
}
