package io.polyapi.plugin.service.visitor;

import com.fasterxml.jackson.databind.type.TypeFactory;
import io.polyapi.plugin.model.ParsedType;
import io.polyapi.plugin.model.type.PolyType;
import io.polyapi.plugin.model.type.basic.AnyPolyType;
import io.polyapi.plugin.model.type.basic.ArrayPolyType;
import io.polyapi.plugin.model.type.basic.PlainPolyType;
import io.polyapi.plugin.model.type.basic.VoidPolyType;
import io.polyapi.plugin.model.type.complex.MapObjectPolyType;
import io.polyapi.plugin.model.type.complex.SchemaObjectPolyType;
import io.polyapi.plugin.model.type.function.FunctionPolyType;
import io.polyapi.plugin.model.type.primitive.PrimitivePolyType;
import io.polyapi.plugin.model.visitor.TypeVisitor;
import io.polyapi.plugin.service.schema.JsonSchemaParser;
import lombok.Getter;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.reflect.TypeUtils;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import static java.lang.String.format;
import static java.util.function.Predicate.isEqual;
import static java.util.function.Predicate.not;

@Slf4j
public class TypeExtractionVisitor implements TypeVisitor {
    private final String defaultName;
    private final JsonSchemaParser jsonSchemaParser;
    private final String basePackage;
    @Getter
    private ParsedType result;

    public TypeExtractionVisitor(String defaultName, String basePackage, JsonSchemaParser jsonSchemaParser) {
        this.defaultName = defaultName;
        this.basePackage = basePackage;
        this.jsonSchemaParser = jsonSchemaParser;
    }

    public void doVisit(PolyType type) {
        log.debug("Extracting type for {}.", type.getKind());
        if (result == null) {
            type.accept(this);
        } else {
            throw new UnsupportedOperationException(format("This visitor has already resolved to '%s' and cannot be reused.", result));
        }
        log.debug("Type for {} extracted.", type.getKind());
    }

    @Override
    public void visit(PolyType polyType) {
        log.trace("Extracting type from PolyType.");
        this.result = new ParsedType(Object.class);
    }

    public void visit(SchemaObjectPolyType type) {
        log.trace("Extracting type from SchemaObjectPolyType.");
        this.result = jsonSchemaParser.getType(defaultName, basePackage, type.getSchema());
    }

    @Override
    public void visit(MapObjectPolyType type) {
        log.trace("Extracting type from MapObjectPolyType.");
        this.result = new ParsedType(TypeFactory.defaultInstance().constructMapType(Map.class, String.class, Object.class));
    }

    @Override
    public void visit(PlainPolyType type) {
        result = Optional.ofNullable(type)
                .map(PlainPolyType::getValue)
                .filter(not(isEqual("void")))
                .map(plainType -> new ParsedType(plainType.equals("any")? TypeUtils.parameterize(Map.class, String.class, Object.class) : Object.class))
                .orElse(new ParsedType(Void.class));
    }

    @Override
    public void visit(VoidPolyType type) {
        log.trace("Extracting type from VoidPolyType.");
        result = new ParsedType(Void.class);
    }

    @Override
    public void visit(ArrayPolyType type) {
        log.trace("Extracting type from ArrayPolyType.");
        doVisit(type.getItems());
        this.result = new ParsedType(List.class.getName(), List.of(this.result));
    }

    @Override
    public void visit(PrimitivePolyType type) {
        log.trace("Extracting type from PrimitivePolyType.");
        this.result = new ParsedType(type.getType().getTypeName());
    }

    @Override
    public void visit(FunctionPolyType type) {
        log.trace("Extracting type from FunctionPolyType.");
        this.result = new ParsedType(Object.class);
    }
}
