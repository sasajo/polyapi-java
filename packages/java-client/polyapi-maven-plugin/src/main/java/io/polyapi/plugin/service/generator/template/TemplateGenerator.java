package io.polyapi.plugin.service.generator.template;

import com.github.jknack.handlebars.Handlebars;
import com.github.jknack.handlebars.Options;
import com.github.jknack.handlebars.io.ClassPathTemplateLoader;
import io.polyapi.plugin.model.specification.PropertySpecification;

import java.util.Collection;
import java.util.List;
import java.util.concurrent.locks.Condition;
import java.util.stream.Collectors;

public class TemplateGenerator extends Handlebars {

  public TemplateGenerator() {
    super(new ClassPathTemplateLoader("/templates", ".hbs"));
    registerHelper("ifIsType", new ConditionHelper<>((object, options) -> object.getClass().getSimpleName().equals(options.param(0))));
    registerHelper("ifIsNotEmpty", new ConditionHelper<>((Collection<?> collection, Options options) -> !collection.isEmpty()));
    registerHelper("renderArguments", (List<PropertySpecification> propertySpecifications, Options options) -> propertySpecifications.stream()
      .map(property -> String.format("%s %s", property.getType().getInCodeType(), property.getInCodeName()))
      .collect(Collectors.joining(", ")));
    registerHelper("ifEquals", new ConditionHelper<>((value, options) -> value.equals(options.param(0))));
  }
}
