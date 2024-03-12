package io.polyapi.plugin.model.specification.function;

import io.polyapi.plugin.model.visitor.PolySpecificationVisitor;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CustomFunctionSpecification extends FunctionSpecification {
    private String[] requirements;
    private String code;
    private String language;

    @Override
    protected String getSpecificationSubtype() {
        return "custom";
    }

    @Override
    public void accept(PolySpecificationVisitor visitor) {
        visitor.visit(this);
    }

    public boolean isJava() {
        return "java".equals(language);
    }
}

