package io.polyapi.plugin.model.specification.function;

import io.polyapi.plugin.model.specification.ApiType;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ApiFunctionSpecification extends FunctionSpecification {
    private ApiType apiType;

    @Override
    protected String getSubtypePackage() {
        return "api";
    }
}
