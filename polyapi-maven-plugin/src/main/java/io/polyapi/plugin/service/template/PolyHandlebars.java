package io.polyapi.plugin.service.template;

import com.github.jknack.handlebars.Handlebars;
import com.github.jknack.handlebars.Options;
import com.github.jknack.handlebars.io.ClassPathTemplateLoader;
import io.polyapi.plugin.utils.StringUtils;

import java.util.function.BiPredicate;
import java.util.function.Function;
import java.lang.reflect.Method;

public class PolyHandlebars extends Handlebars {

    public PolyHandlebars() {
        super(new ClassPathTemplateLoader("/templates", ".hbs"));
        registerSimpleHelper("toCamelCase", StringUtils::toCamelCase);
        registerSimpleHelper("toPascalCase", StringUtils::toCamelCase);
        registerConditionalHelper("ifIsType", (object, options) -> object.getClass().getSimpleName().equals(options.param(0)));
        registerSimpleHelper("lastSegment", (Object fqn) -> {
            if (fqn == null) {
                return "";
            }
            String s = fqn.toString();
            int idx  = s.lastIndexOf('.');
            return idx == -1 ? s : s.substring(idx + 1);
        });
        registerConditionalHelper("eq",
            (obj, opts) -> {
                Object other = opts.param(0, "");
                return obj != null && obj.toString().equals(other == null ? "" : other.toString());
            });
        registerHelper("typeRef", (Object ctx, Options opts) -> {
            if (ctx == null) {
                return "";
            }
            String fqn = ctx.toString();
            String parentSimple = opts.param(0, "").toString();
            String simple = fqn.substring(fqn.lastIndexOf('.') + 1);
            return simple.equals(parentSimple) ? fqn : simple;
        });
        registerHelper("classFqn", (Object ctx, Options o) -> {
            if (ctx == null) return "";

            for (String m : new String[]{"getFullClassName", "getFullName"}) {
                try {
                    Method mm = ctx.getClass().getMethod(m);
                    Object val = mm.invoke(ctx);
                    if (val != null) return val.toString();
                } catch (ReflectiveOperationException ignored) {}
            }

            try {
                Method pm = ctx.getClass().getMethod("getPackageName");
                Method cm = ctx.getClass().getMethod("getClassName");
                Object pkg = pm.invoke(ctx);
                Object cls = cm.invoke(ctx);
                if (pkg != null && cls != null) return pkg + "." + cls;
                if (cls != null)              return cls.toString();
            } catch (ReflectiveOperationException ignored) {}

            return "";
        });
    }

    private <T> void registerSimpleHelper(String name, Function<T, ?> helper) {
        registerHelper(name, (T object, Options options) -> helper.apply(object));
    }

    private <T> void registerConditionalHelper(String name, BiPredicate<T, Options> helper) {
        registerHelper(name, new ConditionHelper<>(helper));
    }

}
