package io.polyapi.plugin.service.template;

import com.github.jknack.handlebars.Handlebars;
import com.github.jknack.handlebars.Options;
import com.github.jknack.handlebars.io.ClassPathTemplateLoader;
import io.polyapi.plugin.model.specification.function.PropertyMetadata;

import java.util.Collection;
import java.util.List;

import static java.lang.String.format;
import static java.util.stream.Collectors.joining;

public class PolyHandlebars extends Handlebars {

  public PolyHandlebars() {
    super(new ClassPathTemplateLoader("/templates", ".hbs"));
    registerHelper("ifIsType", new ConditionHelper<>((object, options) -> object.getClass().getSimpleName().equals(options.param(0))));
    registerHelper("ifIsNotEmpty", new ConditionHelper<>((Collection<?> collection, Options options) -> !collection.isEmpty()));
    registerHelper("renderArguments", (List<PropertyMetadata> propertyData, Options options) -> propertyData.stream()
      .map(property -> format("%s %s", property.getType().getInCodeType(), property.getInCodeName()))
      .collect(joining(", ")));
    registerHelper("ifEquals", new ConditionHelper<>((value, options) -> value.equals(options.param(0))));
    registerHelper("isNull", new ConditionHelper<>((value, options) -> value == null));
  }
}
