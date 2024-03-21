package io.polyapi.plugin.model.type.complex;

import io.polyapi.commons.api.model.PolyObject;
import io.polyapi.plugin.model.type.PropertyPolyType;

import java.util.List;

public interface PropertiesObjectPolyType extends PolyObject {

    List<PropertyPolyType> getProperties();
}
