package io.polyapi.plugin.service.visitor;

import io.polyapi.commons.api.json.JsonParser;
import io.polyapi.plugin.model.generation.KeyValuePair;
import io.polyapi.plugin.model.generation.PropertiesObject;
import io.polyapi.plugin.model.type.PolyType;
import io.polyapi.plugin.model.type.complex.PropertiesObjectPolyType;
import io.polyapi.plugin.model.type.complex.SchemaObjectPolyType;
import io.polyapi.plugin.model.type.function.FunctionSpecPolyType;
import io.polyapi.plugin.model.visitor.TypeVisitor;
import io.polyapi.plugin.service.FileService;
import io.polyapi.plugin.service.schema.JsonSchemaParser;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import static java.lang.String.format;
import static java.util.stream.IntStream.range;

@Slf4j
@AllArgsConstructor
public class TypeCodeGeneratorVisitor implements TypeVisitor {
    private final FileService fileService;
    private final JsonParser jsonParser;
    private final JsonSchemaParser jsonSchemaParser;
    private final String defaultName;
    private final String basePackage;
    private final boolean overwriteFiles;

    public void doVisit(PolyType type) {
        log.debug("Generating code for {}.", type.getKind());
        type.accept(this);
        log.debug("Code for {} generated.", type.getKind());
    }

    public void doVisit(FunctionSpecPolyType function) {
        log.debug("Generating code for {} types.", function.getArguments().size() + Optional.ofNullable(function.getReturnType()).stream().count());
        function.accept(this);
        log.debug("Code generated.");
    }

    @Override
    public void visit(SchemaObjectPolyType type) {
        log.trace("Generating code for schema type with schema:\n{}.", type.getSchema());
        String schema = Optional.ofNullable(type.getSchema()).map(Object::toString).orElse("")
                // replace all > and < with underscores
                .replace(">", "_").replace("<", "_");

        // replace all dots with underscores, but only if they are within quotes
        boolean withinQuotes = false;
        StringBuilder builder = new StringBuilder();
        for (char c : schema.toCharArray()) {
            if (c == '\"') {
                withinQuotes = !withinQuotes;
            }
            if (c == '.' && withinQuotes) {
                builder.append('_');
            } else {
                builder.append(c);
            }
        }
        schema = builder.toString();
        jsonSchemaParser.parse(defaultName, basePackage, schema).forEach(customType -> fileService.generateFile(customType, overwriteFiles));
    }

    @Override
    public void visit(PropertiesObjectPolyType type) {
        log.trace("Generating code for properties object type with properties:\n{}.", type.getProperties());
        ImportsCollectorVisitor importsCollectorVisitor = new ImportsCollectorVisitor(basePackage, defaultName, jsonSchemaParser);
        importsCollectorVisitor.doVisit(PolyType.class.cast(type));
        Set<String> imports = importsCollectorVisitor.getImports();
        List<KeyValuePair<String, String>> properties = new ArrayList<>();
        type.getProperties().forEach(property -> {
            TypeExtractionVisitor typeExtractionVisitor = new TypeExtractionVisitor(defaultName, basePackage, jsonSchemaParser);
            property.accept(typeExtractionVisitor);
            properties.add(new KeyValuePair<>(property.getName(), typeExtractionVisitor.getResult().getFullName()));
        });
        PropertiesObject propertiesObject = new PropertiesObject(basePackage, imports, defaultName, properties);
        fileService.generateFile(propertiesObject, overwriteFiles);
        range(0, type.getProperties().size()).forEach(i -> {
            String childPropertyDefaultClassName = format("%sAttr%s", defaultName, i);
            type.getProperties().forEach(property -> property.accept(new TypeCodeGeneratorVisitor(fileService, jsonParser, jsonSchemaParser, childPropertyDefaultClassName, basePackage, overwriteFiles)));
        });
    }

    @Override
    public void visit(FunctionSpecPolyType type) {
        log.trace("Generating code for FunctionSpecPolyType.");
        Optional.ofNullable(type.getReturnType()).ifPresent(returnType -> returnType.accept(new TypeCodeGeneratorVisitor(fileService, jsonParser, jsonSchemaParser, format("%sResult", defaultName), basePackage, overwriteFiles)));
        range(0, type.getArguments().size()).forEach(i -> type.getArguments().get(i).accept(new TypeCodeGeneratorVisitor(fileService, jsonParser, jsonSchemaParser, format("%sArg%s", defaultName, i), basePackage, overwriteFiles)));
    }
}
