package io.polyapi.plugin.model.type;

import io.polyapi.commons.api.model.PolyObject;
import io.polyapi.plugin.model.visitor.TypeVisitor;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class PropertyPolyType implements PolyObject {
    private String name;
    private Boolean required;
    private PolyType type;

    public void accept(TypeVisitor visitor) {
        visitor.visit(this);
    }
}
