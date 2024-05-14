package io.polyapi.client.api.model.function;

import io.polyapi.commons.api.model.PolyObject;
import lombok.Getter;
import lombok.Setter;

/**
 * Utility class that provides additional functionality to server functions. Available only during execution time.
 */
@Getter
public class PolyCustom implements PolyObject {
    private String environmentId;
}
