package io.polyapi.plugin.model.generation;

import io.polyapi.commons.api.model.PolyObject;

// FIXME: Add an appropriate name for this interface.
public interface Generable extends PolyObject {

    String getPackageName();

    String getClassName();
}
