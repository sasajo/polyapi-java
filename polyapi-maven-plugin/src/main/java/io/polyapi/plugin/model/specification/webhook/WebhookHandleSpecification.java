package io.polyapi.plugin.model.specification.webhook;

import io.polyapi.plugin.model.specification.Specification;
import io.polyapi.plugin.model.type.function.FunctionPolyType;
import io.polyapi.plugin.model.type.function.FunctionSpecPolyType;
import io.polyapi.plugin.model.visitor.PolySpecificationVisitor;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class WebhookHandleSpecification extends Specification {
    private FunctionSpecPolyType function;

    @Override
    public String getSpecificationType() {
        return "webhook";
    }

    @Override
    public void accept(PolySpecificationVisitor visitor) {
        visitor.visit(this);
    }
}
