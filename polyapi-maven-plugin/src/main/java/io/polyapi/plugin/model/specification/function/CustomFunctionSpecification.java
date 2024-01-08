package io.polyapi.plugin.model.specification.function;

import io.polyapi.plugin.model.CustomType;
import io.polyapi.plugin.model.Generable;
import io.polyapi.plugin.service.visitor.CodeGenerationVisitor;
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
        // FIXME: This should always be the code. But as there are some functions (particularly old ones) that have a class declaration,
        //  then this is necessary. When that is migrated in the database, remove this if and its contents.
        if (code.contains("class PolyCustomFunction")) {
            String partialResult = Pattern.compile("(.*\\n)*    private.*", CASE_INSENSITIVE + MULTILINE).matcher(code).replaceAll("");
            return Pattern.compile(" *} *[}\\n] *[}\\n]$", CASE_INSENSITIVE + MULTILINE).matcher(partialResult).replaceAll("").trim();
        }
        return code;
    }

    @Override
    public void accept(CodeGenerationVisitor visitor) {
        visitor.visit(this);
    }

    public boolean isJava() {
        return "java".equals(language);
    }
}

