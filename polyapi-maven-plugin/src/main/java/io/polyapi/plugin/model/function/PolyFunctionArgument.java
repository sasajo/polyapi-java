package io.polyapi.plugin.model.function;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class PolyFunctionArgument {
    private String key;
    private String name;
    private String type;
    private String typeSchema;
    private Boolean required;
    private Boolean secure;
}
