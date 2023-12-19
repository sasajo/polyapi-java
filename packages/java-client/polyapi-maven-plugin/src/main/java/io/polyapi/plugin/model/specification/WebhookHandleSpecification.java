package io.polyapi.plugin.model.specification;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class WebhookHandleSpecification extends Specification {
  private FunctionSpecification function;

  @Override
  protected String getTypePackage() {
    return "webhook";
  }
}
