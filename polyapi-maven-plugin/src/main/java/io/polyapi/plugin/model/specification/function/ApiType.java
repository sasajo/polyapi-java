package io.polyapi.plugin.model.specification.function;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;
import io.polyapi.commons.api.model.PolyObject;

public enum ApiType implements PolyObject {
    GRAPHQL("graphql"),
    REST("rest");

    private final String jsonValue;

    ApiType(String jsonValue) {
        this.jsonValue = jsonValue;
    }

    @JsonCreator
    public static ApiType fromJsonValue(String jsonValue) {
        for (ApiType type : ApiType.values()) {
            if (type.jsonValue.equalsIgnoreCase(jsonValue)) {
                return type;
            }
        }
        throw new IllegalArgumentException("Unexpected value '" + jsonValue + "'");
    }

    @JsonValue
    public String jsonValue() {
        return this.jsonValue;
    }
}
