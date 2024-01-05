package io.polyapi.client.api;

import io.polyapi.commons.api.model.Visibility;
import lombok.Getter;
import lombok.Setter;

import java.util.Map;

@Setter
@Getter
public class VariableUpdateResponse<T> {

  private Data<T> data;
  private int status;
  private Map<String, String> headers;

  public VariableUpdateResponse(Data<T> data, int status, Map<String, String> headers) {
    this.data = data;
    this.status = status;
    this.headers = headers;
  }

  @Setter
  @Getter
  public static class Data<T> {
    private String id;
    private String context;
    private String name;
    private String description;
    private Visibility visibility;
    private boolean secret;
    private T value;
  }
}
