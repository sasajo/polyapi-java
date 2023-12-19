package io.polyapi.plugin.model.specification;

import com.fasterxml.jackson.annotation.JsonSubTypes;
import com.fasterxml.jackson.annotation.JsonTypeInfo;
import io.polyapi.commons.api.model.PolyObject;
import io.polyapi.plugin.model.Generable;
import io.polyapi.plugin.model.VisibilityMetadata;
import io.polyapi.plugin.utils.StringUtils;
import lombok.Getter;
import lombok.Setter;

import java.util.Optional;
import java.util.function.Predicate;

import static java.util.function.Predicate.not;

@Getter
@Setter
@JsonTypeInfo(
  use = JsonTypeInfo.Id.NAME,
  property = "type"
)
@JsonSubTypes({
  @JsonSubTypes.Type(value = ApiFunctionSpecification.class, name = "apiFunction"),
  @JsonSubTypes.Type(value = CustomFunctionSpecification.class, name = "customFunction"),
  @JsonSubTypes.Type(value = ServerFunctionSpecification.class, name = "serverFunction"),
  @JsonSubTypes.Type(value = AuthFunctionSpecification.class, name = "authFunction"),
  @JsonSubTypes.Type(value = WebhookHandleSpecification.class, name = "webhookHandle"),
  @JsonSubTypes.Type(value = ServerVariableSpecification.class, name = "serverVariable"),
})
public abstract class Specification implements Generable {
  private String id;
  private String context;
  private String name;
  private String description;
  private VisibilityMetadata visibilityMetadata;

  public boolean isRootContext() {
    return getContext().isEmpty();
  }

  @Override
  public String getPackageName() {
    return "io.polyapi.poly." + getTypePackage() + Optional.ofNullable(context).filter(not(String::isBlank)).map(String::toLowerCase).map(value -> "." + value).orElse("");
  }


  protected abstract String getTypePackage();


  @Override
  public String getClassName() {
    return StringUtils.toPascalCase(getName());
  }
}
