package io.polyapi.plugin.model.specification.variable;

import io.polyapi.plugin.model.specification.Specification;
import io.polyapi.plugin.service.visitor.PolyVisitor;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ServerVariableSpecification extends Specification {
    private VariableSpecification variable;

    @Override
    protected String getTypePackage() {
        return "variable.server";
    }

    public String getType() {
        return variable.getValueType().getType(getClassName() + "Value");
    }

    @Override
    public void accept(PolyVisitor visitor) {
        visitor.visit(this);
    }
}
