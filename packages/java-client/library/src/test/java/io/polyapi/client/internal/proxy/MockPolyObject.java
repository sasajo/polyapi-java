package io.polyapi.client.internal.proxy;

import io.polyapi.commons.api.model.PolyEntity;
import io.polyapi.commons.api.model.PolyMetadata;
import io.polyapi.commons.api.model.PolyObject;

/**
 * Mock interface that extends {@link PolyObject}
 */
@PolyEntity("This is a test value")
@PolyMetadata(paramTypes = {"String"}, paramNames = "parameter")
public interface MockPolyObject extends PolyObject {
  String doMagic(String parameter);
}
