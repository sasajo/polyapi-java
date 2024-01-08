package io.polyapi.plugin.model.specification.variable;

import io.polyapi.plugin.model.property.PropertyType;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class VariableSpecification {
    private String environmentId;
    private boolean secret;
    private PropertyType valueType;
    private Object value;

    public VariableSpecification() {
        var obj = new Object();

    }
}
