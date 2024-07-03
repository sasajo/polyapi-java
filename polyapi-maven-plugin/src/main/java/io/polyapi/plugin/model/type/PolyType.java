package io.polyapi.plugin.model.type;

import com.fasterxml.jackson.annotation.JsonSubTypes;
import com.fasterxml.jackson.annotation.JsonTypeInfo;

import io.polyapi.commons.api.model.PolyObject;
import io.polyapi.plugin.model.type.basic.ArrayPolyType;
import io.polyapi.plugin.model.type.basic.PlainPolyType;
import io.polyapi.plugin.model.type.basic.AnyPolyType;
import io.polyapi.plugin.model.type.basic.VoidPolyType;
import io.polyapi.plugin.model.type.complex.ObjectPolyType;
import io.polyapi.plugin.model.type.function.FunctionPolyType;
import io.polyapi.plugin.model.type.primitive.PrimitivePolyType;
import io.polyapi.plugin.model.visitor.TypeVisitor;
import lombok.Getter;
import lombok.Setter;

@JsonTypeInfo(
        use = JsonTypeInfo.Id.NAME,
        property = "kind",
        visible = true,
        defaultImpl = AnyPolyType.class
)
@JsonSubTypes({
        @JsonSubTypes.Type(value = VoidPolyType.class, name = "void"),
        @JsonSubTypes.Type(value = PrimitivePolyType.class, name = "primitive"),
        @JsonSubTypes.Type(value = ArrayPolyType.class, name = "array"),
        @JsonSubTypes.Type(value = ObjectPolyType.class, name = "object"),
        @JsonSubTypes.Type(value = FunctionPolyType.class, name = "function"),
        @JsonSubTypes.Type(value = PlainPolyType.class, name = "plain")
})
@Getter
@Setter
public abstract class PolyType implements PolyObject {
    private String kind;

    public void accept(TypeVisitor visitor) {
        visitor.visit(this);
    }
}
