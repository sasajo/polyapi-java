package io.polyapi.plugin.model.type.complex;

import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import io.polyapi.commons.internal.json.RawValueDeserializer;
import io.polyapi.plugin.model.type.PolyType;
import io.polyapi.plugin.model.type.PropertyPolyType;
import io.polyapi.plugin.model.visitor.TypeVisitor;
import lombok.Getter;
import lombok.Setter;
import lombok.extern.slf4j.Slf4j;

import java.util.List;

@Getter
@Setter
@Slf4j
public class ObjectPolyType extends PolyType implements PropertiesObjectPolyType, SchemaObjectPolyType, MapObjectPolyType {
    @JsonDeserialize(using = RawValueDeserializer.class)
    private String schema;
    private List<PropertyPolyType> properties;
    private String typeName;

    public void accept(TypeVisitor visitor) {
        if (schema == null) {
            if (properties == null) {
                if (typeName == null) {
                    visitor.visit(this);
                } else {
                    visitor.visit(MapObjectPolyType.class.cast(this));
                }
            } else {
                visitor.visit(PropertiesObjectPolyType.class.cast(this));
            }
        } else {
            visitor.visit(SchemaObjectPolyType.class.cast(this));
        }
    }
}
