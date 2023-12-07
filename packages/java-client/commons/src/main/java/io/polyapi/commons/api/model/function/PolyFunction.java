package io.polyapi.commons.api.model.function;


import lombok.Getter;
import lombok.Setter;

import java.util.List;
import java.util.Map;

@Getter
@Setter
public class PolyFunction {
  private String id;
  private String name;
  private String description;
  private String context;
  private String code;
  private String language = "java";
  private String returnType;
  private Map<String, Object> returnTypeSchema;
  private List<PolyFunctionArgument> arguments;
}
