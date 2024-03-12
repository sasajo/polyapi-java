package io.polyapi.plugin.model.generation;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class ServerVariableHandler implements Generable {
    private String packageName;
    private String className;
    private String valueType;
    private Boolean secret;
}
