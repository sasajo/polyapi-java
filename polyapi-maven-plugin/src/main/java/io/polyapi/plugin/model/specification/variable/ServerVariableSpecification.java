package io.polyapi.plugin.model.specification.variable;

import io.polyapi.plugin.model.specification.Specification;
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
}
