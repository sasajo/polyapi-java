package io.polyapi.plugin.service.visitor;

import io.polyapi.commons.api.websocket.Handle;
import io.polyapi.plugin.model.specification.Specification;
import io.polyapi.plugin.model.specification.function.FunctionSpecification;
import io.polyapi.plugin.model.specification.variable.ServerVariableSpecification;
import io.polyapi.plugin.model.specification.webhook.WebhookHandleSpecification;
import io.polyapi.plugin.model.type.PolyType;
import io.polyapi.plugin.model.type.basic.ArrayPolyType;
import io.polyapi.plugin.model.type.complex.MapObjectPolyType;
import io.polyapi.plugin.model.type.complex.PropertiesObjectPolyType;
import io.polyapi.plugin.model.type.complex.SchemaObjectPolyType;
import io.polyapi.plugin.model.type.function.FunctionPolyType;
import io.polyapi.plugin.model.type.function.FunctionSpecPolyType;
import io.polyapi.plugin.model.visitor.PolySpecificationVisitor;
import io.polyapi.plugin.model.visitor.TypeVisitor;
import io.polyapi.plugin.service.schema.JsonSchemaParser;
import lombok.Getter;
import lombok.extern.slf4j.Slf4j;

import java.util.*;
import java.util.function.Consumer;

import static java.lang.String.format;
import static java.util.function.Predicate.not;
import static java.util.stream.IntStream.range;

@Slf4j
public class ImportsCollectorVisitor implements TypeVisitor, PolySpecificationVisitor {
    private final String basePackage;
    private final String defaultType;

    @Getter
    private final Set<String> imports = new HashSet<>();
    private final JsonSchemaParser jsonSchemaParser;

    public ImportsCollectorVisitor(String basePackage, String defaultType, JsonSchemaParser jsonSchemaParser) {
        this.basePackage = basePackage;
        this.defaultType = defaultType;
        this.jsonSchemaParser = jsonSchemaParser;
    }

    public void doVisit(PolyType type) {
        log.debug("Extracting imports from type {}.", type.getKind());
        type.accept(this);
        log.debug("Imports from type {} extracted.", type.getKind());
    }

    @Override
    public void doVisit(Specification specification) {
        log.debug("Extracting imports from {} specification '{}' on context '{}'.", specification.getType(), specification.getName(), specification.getContext());
        PolySpecificationVisitor.super.doVisit(specification);
        log.debug("Imports from {} specification '{}' on context '{}' extracted.", specification.getType(), specification.getName(), specification.getContext());
    }

    @Override
    public void visit(SchemaObjectPolyType type) {
        log.trace("Retrieving imports for SchemaObjectPolyType.");
        Optional.of(type)
                .map(SchemaObjectPolyType::getSchema)
                .filter(not(String::isBlank))
                .map(schema -> jsonSchemaParser.getType(defaultType, basePackage, schema));
    }

    @Override
    public void visit(PropertiesObjectPolyType type) {
        log.trace("Retrieving imports for PropertiesObjectPolyType.");
        imports.add(format("%s.%s", basePackage, defaultType));
    }

    @Override
    public void visit(FunctionSpecPolyType type) {
        log.trace("Retrieving imports for FunctionSpecPolyType.");
        ImportsCollectorVisitor resultImportsCollectorVisitor = new ImportsCollectorVisitor(basePackage, format("%sResult", defaultType), jsonSchemaParser);
        Optional.ofNullable(type.getReturnType()).ifPresent(resultImportsCollectorVisitor::doVisit);
        imports.addAll(resultImportsCollectorVisitor.imports);
        range(0, type.getArguments().size()).forEach(i -> {
            ImportsCollectorVisitor argumentImportsCollectorVisitor = new ImportsCollectorVisitor(basePackage, format("%sArg%s", defaultType, i), jsonSchemaParser);
            type.getArguments().get(i).accept(argumentImportsCollectorVisitor);
            imports.addAll(argumentImportsCollectorVisitor.imports);
        });
    }

    @Override
    public void visit(MapObjectPolyType type) {
        log.trace("Retrieving imports for MapObjectPolyType.");
        this.imports.add(Map.class.getName());
    }

    @Override
    public void visit(ArrayPolyType type) {
        log.trace("Retrieving imports for ArrayPolyType.");
        this.imports.add(List.class.getName());
        TypeVisitor.super.visit(type);
    }

    @Override
    public void visit(FunctionSpecification specification) {
        log.trace("Retrieving imports for FunctionSpecification.");
        this.imports.add(format("%s.%s", specification.getPackageName(), specification.getClassName()));
        specification.getFunction().accept(this);
    }

    @Override
    public void visit(ServerVariableSpecification specification) {
        log.trace("Retrieving imports for ServerVariableSpecification.");
        this.imports.add(format("%s.%s", specification.getPackageName(), specification.getClassName()));
        doVisit(specification.getVariable());
    }

    @Override
    public void visit(WebhookHandleSpecification specification) {
        log.trace("Retrieving imports for WebhookHandleSpecification.");
        this.imports.add(Handle.class.getName());
        this.imports.add(Consumer.class.getName());
        this.imports.add(format("%s.%s", specification.getPackageName(), specification.getClassName()));
        FunctionPolyType.class.cast(specification.getFunction().getArguments().get(0).getType()).getSpec().getArguments().get(0).accept(this);
    }
}
