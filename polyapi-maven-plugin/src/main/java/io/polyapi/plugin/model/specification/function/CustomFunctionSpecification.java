package io.polyapi.plugin.model.specification.function;

import io.polyapi.plugin.model.CustomType;
import io.polyapi.plugin.model.Generable;
import io.polyapi.plugin.service.visitor.CodeGenerationVisitor;
import io.polyapi.plugin.service.visitor.PolyVisitor;
import lombok.Getter;
import lombok.Setter;

import java.util.List;
import java.util.regex.Pattern;

import static java.lang.String.format;
import static java.util.regex.Pattern.CASE_INSENSITIVE;
import static java.util.regex.Pattern.MULTILINE;

@Getter
@Setter
public class CustomFunctionSpecification extends FunctionSpecification {
    private String[] requirements;
    private String code;
    private String language;

    @Override
    protected String getSubtypePackage() {
        return "custom";
    }

    public String getCode() {
        return code;
    }

    @Override
    public void accept(PolyVisitor visitor) {
        visitor.visit(this);
    }

    public boolean isJava() {
        return "java".equals(language);
    }
}

