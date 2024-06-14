package io.polyapi.plugin.model;

import io.polyapi.commons.api.model.PolyObject;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

@Setter
@Getter
@ToString
public class ServerVariable implements PolyObject {
    private String id;
    private String name;
    private String description;
    private Object value;
    private boolean secret;
    private String context;
}
