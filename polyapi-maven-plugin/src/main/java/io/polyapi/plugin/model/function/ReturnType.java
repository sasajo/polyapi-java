package io.polyapi.plugin.model.function;

import java.util.Map;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ReturnType {
  private Integer statusCode;
  private String type;
  private Map<String, Object> schema;
}
