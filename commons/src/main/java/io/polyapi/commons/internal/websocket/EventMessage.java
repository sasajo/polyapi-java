package io.polyapi.commons.internal.websocket;

import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import io.polyapi.commons.api.model.PolyEvent;
import io.polyapi.commons.internal.json.RawValueDeserializer;
import lombok.Getter;
import lombok.Setter;

import java.util.Map;

@Getter
@Setter
public class EventMessage extends PolyEvent {
    private Map<String, String> headers;
    private Map<String, Object> params;
    @JsonDeserialize(using = RawValueDeserializer.class)
    private String body;
}
