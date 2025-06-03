package io.polyapi.plugin.model.function;

import io.polyapi.plugin.model.specification.SchemaRef;
import java.util.List;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class PolyFunctionArgument {
    private String key;
    private String name;
    private String description;
    private String type;
    private String typeSchema;
    private Boolean required;
    private Boolean secure;
    private List<SchemaRef> unresolvedPolySchemaRefs;
}
