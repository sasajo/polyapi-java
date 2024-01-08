package io.polyapi.plugin.service.visitor;

import io.polyapi.plugin.model.CustomType;
import io.polyapi.plugin.model.specification.Context;
import io.polyapi.plugin.model.specification.Specification;
import io.polyapi.plugin.model.specification.function.CustomFunctionSpecification;
import io.polyapi.plugin.model.specification.function.FunctionSpecification;

public interface PolyVisitor {
    void visit(Specification specification);

    void visit(FunctionSpecification specification);

    void visit(CustomFunctionSpecification specification);

    void visit(Context context);

    void visit(CustomType customType);
}
