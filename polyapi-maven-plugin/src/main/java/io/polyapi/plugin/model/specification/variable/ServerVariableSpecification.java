package io.polyapi.plugin.model.specification.variable;

import io.polyapi.plugin.model.specification.Specification;
import io.polyapi.plugin.model.visitor.PolySpecificationVisitor;
import lombok.Getter;
import lombok.Setter;

import static java.lang.String.format;

@Getter
@Setter
public class ServerVariableSpecification extends Specification {
    private VariablePolyType variable;

    @Override
    public String getClassName() {
        return format("%sHandler", getTypeName());
    }

    @Override
    public String getSpecificationType() {
        return "variable.server";
    }

    @Override
    public void accept(PolySpecificationVisitor visitor) {
        visitor.visit(this);
    }

    public String getTypeName() {
        return super.getClassName();
    }
}
