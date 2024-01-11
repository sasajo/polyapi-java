package io.polyapi.client.api;

import lombok.Getter;
import lombok.Setter;

import java.util.Map;

@Setter
@Getter
public class ApiFunctionResponse<T> {
  private T data;
  private Map<String, String> headers;
  private int status;
}
