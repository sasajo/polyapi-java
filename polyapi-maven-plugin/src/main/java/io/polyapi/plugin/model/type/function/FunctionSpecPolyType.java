package io.polyapi.plugin.model.type.function;

import io.polyapi.commons.api.model.PolyObject;
import io.polyapi.plugin.model.type.PropertyPolyType;
import io.polyapi.plugin.model.type.PolyType;
import io.polyapi.plugin.model.visitor.TypeVisitor;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class FunctionSpecPolyType implements PolyObject {
    private List<PropertyPolyType> arguments;
    private PolyType returnType;
    private Boolean synchronous;

    public void accept(TypeVisitor visitor) {
        visitor.visit(this);
    }
}
