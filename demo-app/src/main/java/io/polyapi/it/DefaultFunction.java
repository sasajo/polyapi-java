package io.polyapi.it;

import io.polyapi.commons.api.model.PolyServerFunction;

public class DefaultFunction {

    @PolyServerFunction
    public String defaultFunction(String parameter) {
        return String.format("%s - %s", parameter, parameter);
    }
}
