package io.polyapi.plugin.model.type.complex;

import io.polyapi.commons.api.model.PolyObject;
import io.polyapi.plugin.model.type.PropertyPolyType;
import io.polyapi.plugin.model.visitor.TypeVisitor;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

public interface PropertiesObjectPolyType extends PolyObject {

    List<PropertyPolyType> getProperties();
}
