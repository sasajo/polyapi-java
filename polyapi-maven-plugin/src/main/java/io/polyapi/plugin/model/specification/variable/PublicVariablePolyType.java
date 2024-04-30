package io.polyapi.plugin.model.specification.variable;

import lombok.Getter;

@Getter
public class PublicVariablePolyType<T> extends VariablePolyType {

    private T value;
}
