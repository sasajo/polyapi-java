package io.polyapi.plugin.service.template;

import com.github.jknack.handlebars.Handlebars;
import com.github.jknack.handlebars.Options;
import com.github.jknack.handlebars.io.ClassPathTemplateLoader;
import io.polyapi.plugin.utils.StringUtils;

import java.util.function.BiPredicate;
import java.util.function.Function;

public class PolyHandlebars extends Handlebars {

    public PolyHandlebars() {
        super(new ClassPathTemplateLoader("/templates", ".hbs"));
        registerSimpleHelper("toCamelCase", StringUtils::toCamelCase);
        registerSimpleHelper("toPascalCase", StringUtils::toCamelCase);
        registerConditionalHelper("ifIsType", (object, options) -> object.getClass().getSimpleName().equals(options.param(0)));
    }

    private <T> void registerSimpleHelper(String name, Function<T, ?> helper) {
        registerHelper(name, (T object, Options options) -> helper.apply(object));
    }

    private <T> void registerConditionalHelper(String name, BiPredicate<T, Options> helper) {
        registerHelper(name, new ConditionHelper<>(helper));
    }

}
