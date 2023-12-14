package io.polyapi.client.internal.proxy;

import io.polyapi.commons.api.model.PolyEntity;
import io.polyapi.commons.api.model.PolyMetadata;
import io.polyapi.commons.api.model.PolyObject;

/**
 * Mock interface that extends {@link PolyObject}
 */
@PolyEntity(value = "This is a test value", metadata = @PolyMetadata(paramTypes = {String.class}, paramNames = "parameter"))
public interface MockPolyObject extends PolyObject {
  String doMagic(String parameter);
}
