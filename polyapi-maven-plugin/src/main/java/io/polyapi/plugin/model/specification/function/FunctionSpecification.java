package io.polyapi.plugin.model.specification.function;

import io.polyapi.plugin.model.specification.Specification;
import io.polyapi.plugin.model.type.function.FunctionSpecPolyType;
import io.polyapi.plugin.model.visitor.PolySpecificationVisitor;
import lombok.Getter;
import lombok.Setter;

import java.util.Set;

import static java.lang.String.format;

@Getter
@Setter
public abstract class FunctionSpecification extends Specification {
    private FunctionSpecPolyType function;

    @Override
    public String getSpecificationType() {
        return "function." + getSpecificationSubtype();
    }

    protected abstract String getSpecificationSubtype();

    @Override
    public void accept(PolySpecificationVisitor visitor) {
        visitor.visit(this);
    }
}
