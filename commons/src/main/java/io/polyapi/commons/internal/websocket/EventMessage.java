package io.polyapi.commons.internal.websocket;

import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import io.polyapi.commons.internal.json.RawValueDeserializer;
import lombok.Getter;
import lombok.Setter;

import java.util.Map;

@Getter
@Setter
public class EventMessage {
    private Map<String, Object> headers;
    @JsonDeserialize(using = RawValueDeserializer.class)
    private String body;
}
