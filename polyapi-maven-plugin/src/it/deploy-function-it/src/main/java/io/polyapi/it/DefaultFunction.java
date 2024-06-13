package io.polyapi.it;

import io.polyapi.commons.api.model.PolyFunction;

public class DefaultFunction {

    @PolyFunction
    public String defaultFunction(String parameter) {
        return String.format("%s - %s", parameter, parameter);
    }
}
