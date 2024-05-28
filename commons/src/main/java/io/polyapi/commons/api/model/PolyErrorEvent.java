package io.polyapi.commons.api.model;

import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

import java.util.Map;

@Getter
@Setter
@ToString
public class PolyErrorEvent extends PolyEvent {
    private String functionId;
    private Map<String, Object> data;
    private String message;
    private String applicationId;
    private String userId;
    private Integer status;
}
