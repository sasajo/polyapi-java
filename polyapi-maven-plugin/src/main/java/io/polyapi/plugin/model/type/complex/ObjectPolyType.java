package io.polyapi.plugin.model.type.complex;

import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import io.polyapi.commons.internal.json.RawValueDeserializer;
import io.polyapi.plugin.model.type.PolyType;
import io.polyapi.plugin.model.type.PropertyPolyType;
import io.polyapi.plugin.model.visitor.TypeVisitor;
import lombok.Getter;
import lombok.Setter;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.List;

import static java.lang.String.format;

@Getter
@Setter
public class ObjectPolyType extends PolyType implements PropertiesObjectPolyType, SchemaObjectPolyType, MapObjectPolyType {
    private static final Logger logger = LoggerFactory.getLogger(ObjectPolyType.class);
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
