package io.polyapi.plugin.model.type.function;

import io.polyapi.plugin.model.type.PolyType;
import io.polyapi.plugin.model.visitor.TypeVisitor;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class FunctionPolyType extends PolyType {
    private String name;
    private FunctionSpecPolyType spec;

    public void accept(TypeVisitor visitor) {
        visitor.visit(this);
    }
}
