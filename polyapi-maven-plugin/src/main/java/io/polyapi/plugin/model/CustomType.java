package io.polyapi.plugin.model;

import io.polyapi.plugin.service.visitor.CodeGenerationVisitor;
import lombok.Getter;

import java.util.List;

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

    @Override
    public void accept(CodeGenerationVisitor visitor) {
        visitor.visit(this);
    }
}
