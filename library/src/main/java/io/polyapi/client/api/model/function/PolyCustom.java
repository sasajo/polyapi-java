package io.polyapi.client.api.model.function;

import io.polyapi.commons.api.model.PolyObject;
import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

/**
 * Utility class that provides additional functionality and information to server functions. Available only during execution time.
 */
@Getter
@ToString
@EqualsAndHashCode
@AllArgsConstructor
public final class PolyCustom implements PolyObject {
    private String executionId;
    private String executionApiKey;

    @Setter
    private Integer responseStatusCode;

    @Setter
    private String responseContentType;
}
