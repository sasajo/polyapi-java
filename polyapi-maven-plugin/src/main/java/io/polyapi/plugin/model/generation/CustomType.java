package io.polyapi.plugin.model.generation;

import io.polyapi.plugin.model.visitor.GenerableVisitor;
import io.polyapi.plugin.utils.StringUtils;
import lombok.Getter;

import static io.polyapi.plugin.utils.StringUtils.toPascalCase;

@Getter
public class CustomType implements Generable {
    private final String packageName;
    private final String name;
    private final String code;

    public CustomType(String packageName, String name, String code) {
        this.packageName = packageName;
        this.name = name;
        this.code = code;
    }

    public void accept(GenerableVisitor visitor) {
        visitor.visit(this);
    }

    @Override
    public String getClassName() {
        return toPascalCase(name);
    }
}
