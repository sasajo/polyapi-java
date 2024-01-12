package io.polyapi.plugin.model.specification.function;

import io.polyapi.plugin.model.specification.Specification;
import io.polyapi.plugin.service.visitor.CodeGenerationVisitor;
import io.polyapi.plugin.service.visitor.PolyVisitor;
import lombok.Getter;
import lombok.Setter;

import java.util.Set;

import static java.lang.String.format;

@Getter
@Setter
public abstract class FunctionSpecification extends Specification {
    private FunctionMetadata function;

    @Override
    protected String getTypePackage() {
        return "function." + getSubtypePackage();
    }

    public String getResultType() {
        return function.getResultType(format("%sResponse", getClassName()));
    }

    public Set<String> getImports() {
        return function.getImports(getPackageName(), getClassName());
    }

    protected abstract String getSubtypePackage();

    @Override
    public void accept(PolyVisitor visitor) {
        visitor.visit(this);
    }
}
