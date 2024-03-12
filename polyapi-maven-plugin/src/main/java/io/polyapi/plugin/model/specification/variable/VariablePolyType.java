package io.polyapi.plugin.model.specification.variable;

import com.fasterxml.jackson.annotation.JsonSubTypes;
import com.fasterxml.jackson.annotation.JsonTypeInfo;
import io.polyapi.plugin.model.type.PolyType;
import io.polyapi.plugin.model.visitor.TypeVisitor;
import lombok.Getter;
import lombok.Setter;

@JsonTypeInfo(
        use = JsonTypeInfo.Id.NAME,
        property = "secret"
)
@JsonSubTypes({
        @JsonSubTypes.Type(value = SecretVariablePolyType.class, name = "true"),
        @JsonSubTypes.Type(value = PublicVariablePolyType.class, name = "false")
})
@Getter
@Setter
public class VariablePolyType extends PolyType {
    private boolean secret;
    private String environmentId;
    private PolyType valueType;

    @Override
    public void accept(TypeVisitor visitor) {
        visitor.visit(this);
    }
}
