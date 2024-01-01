package io.polyapi.client.internal.proxy;

import io.polyapi.client.api.model.PolyEntity;
import io.polyapi.client.api.model.PolyMetadata;
import io.polyapi.commons.api.model.PolyObject;
import io.polyapi.client.api.model.function.server.PolyServerFunction;

/**
 * Mock interface that extends {@link PolyObject}
 */
@PolyEntity("This is a test value")
@PolyMetadata(paramTypes = {"String"}, paramNames = "parameter")
public interface MockPolyServerFunction extends PolyServerFunction {

  String doMagic(String parameter);
}
