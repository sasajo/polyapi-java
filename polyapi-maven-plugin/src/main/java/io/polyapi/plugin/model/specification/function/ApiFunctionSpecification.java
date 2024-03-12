package io.polyapi.plugin.model.specification.function;

import io.polyapi.plugin.model.visitor.PolySpecificationVisitor;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ApiFunctionSpecification extends FunctionSpecification {
    private ApiType apiType;

    @Override
    public void accept(PolySpecificationVisitor visitor) {
        visitor.visit(this);
    }

    @Override
    protected String getSpecificationSubtype() {
        return "api";
    }
}
