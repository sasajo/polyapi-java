package io.polyapi.plugin.model.specification.function;

import io.polyapi.plugin.model.visitor.PolySpecificationVisitor;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AuthFunctionSpecification extends FunctionSpecification {
    private String subResource;

    public boolean isAudienceRequired() {
        return getFunction().getArguments().stream().anyMatch(argument -> argument.getName().equals("audience"));
    }

    @Override
    public void accept(PolySpecificationVisitor visitor) {
        visitor.visit(this);
    }

    @Override
    protected String getSpecificationSubtype() {
        return "auth";
    }
}

