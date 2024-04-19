package io.polyapi.plugin.model.specification.function;

import io.polyapi.plugin.model.specification.Specification;
import io.polyapi.plugin.model.type.function.FunctionSpecPolyType;
import io.polyapi.plugin.model.visitor.PolySpecificationVisitor;
import lombok.Getter;
import lombok.Setter;

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

    @Override
    public int hashCode() {
        final int prime = 31;
        int result = super.hashCode();
        result = prime * result + ((function == null) ? 0 : function.hashCode());
        return result;
    }

    @Override
    public boolean equals(Object obj) {
        if (this == obj)
            return true;
        if (!super.equals(obj))
            return false;
        if (getClass() != obj.getClass())
            return false;
        FunctionSpecification other = (FunctionSpecification) obj;
        if (function == null) {
            if (other.function != null)
                return false;
        } else if (!function.equals(other.function))
            return false;
        return true;
    }

    
}
