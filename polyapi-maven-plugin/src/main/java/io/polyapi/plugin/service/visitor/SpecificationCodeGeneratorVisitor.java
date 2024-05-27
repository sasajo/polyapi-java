package io.polyapi.plugin.service.visitor;

import io.polyapi.commons.api.json.JsonParser;
import io.polyapi.commons.api.model.PolyGeneratedClass;
import io.polyapi.plugin.model.function.CodeObject;
import io.polyapi.plugin.model.generation.CustomType;
import io.polyapi.plugin.model.specification.Specification;
import io.polyapi.plugin.model.specification.function.CustomFunctionSpecification;
import io.polyapi.plugin.model.specification.function.FunctionSpecification;
import io.polyapi.plugin.model.specification.function.ServerFunctionSpecification;
import io.polyapi.plugin.model.specification.resolved.ResolvedCustomFunctionSpecification;
import io.polyapi.plugin.model.specification.resolved.ResolvedServerVariableSpecification;
import io.polyapi.plugin.model.specification.resolved.ResolvedSpecification;
import io.polyapi.plugin.model.specification.resolved.ResolvedWebhookHandleSpecification;
import io.polyapi.plugin.model.specification.variable.ServerVariableSpecification;
import io.polyapi.plugin.model.specification.webhook.WebhookHandleSpecification;
import io.polyapi.plugin.model.type.function.FunctionPolyType;
import io.polyapi.plugin.model.visitor.PolySpecificationVisitor;
import io.polyapi.plugin.service.FileService;
import io.polyapi.plugin.service.generation.PolyObjectResolverService;
import io.polyapi.plugin.service.schema.JsonSchemaParser;
import lombok.extern.slf4j.Slf4j;

import java.util.Optional;

import static java.lang.String.format;

@Slf4j
public class SpecificationCodeGeneratorVisitor implements PolySpecificationVisitor {

    private final JsonSchemaParser jsonSchemaParser;
    private final JsonParser jsonParser;
    private final PolyObjectResolverService resolver;
    private final FileService fileService;
    private final boolean overwriteFiles;

    public SpecificationCodeGeneratorVisitor(FileService fileService, PolyObjectResolverService resolver, JsonParser jsonParser, JsonSchemaParser jsonSchemaParser, boolean overwriteFiles) {
        this.fileService = fileService;
        this.resolver = resolver;
        this.jsonParser = jsonParser;
        this.jsonSchemaParser = jsonSchemaParser;
        this.overwriteFiles = overwriteFiles;
    }

    @Override
    public void doVisit(Specification specification) {
        log.debug("Generating code for {} specification '{}' on context '{}'.", specification.getType(), specification.getName(), specification.getContext());
        specification.accept(this);
        log.debug("Code for {} specification '{}' on context '{}' generated.", specification.getType(), specification.getName(), specification.getContext());
    }

    @Override
    public void visit(FunctionSpecification specification) {
        log.trace("Generating code for FunctionSpecification.");
        PolyObjectResolverVisitor visitor = new PolyObjectResolverVisitor(resolver);
        visitor.doVisit(specification);
        ResolvedSpecification resolvedSpecification = visitor.getResult();
        fileService.generateFile(resolvedSpecification, overwriteFiles);
        new TypeCodeGeneratorVisitor(fileService, jsonParser, jsonSchemaParser, resolvedSpecification.getClassName(), resolvedSpecification.getPackageName(), overwriteFiles).doVisit(specification.getFunction());
    }

    public void visit(ServerFunctionSpecification specification) {
        log.trace("Generating code for ServerFunctionSpecification.");
        visit(FunctionSpecification.class.cast(specification));
    }

    @Override
    public void visit(CustomFunctionSpecification specification) {
        log.trace("Generating code for CustomFunctionSpecification.");
        ResolvedCustomFunctionSpecification resolvedSpecification = resolver.resolve(specification);
        fileService.generateFile(resolvedSpecification, overwriteFiles);
        specification.getFunction().accept(new TypeCodeGeneratorVisitor(fileService, jsonParser, jsonSchemaParser, resolvedSpecification.getClassName(), resolvedSpecification.getPackageName(), overwriteFiles));
        CodeObject codeObject = Optional.of(specification.getCode())
                .map(String::trim)
                .filter(code -> code.startsWith("{"))
                .map(code -> jsonParser.<CodeObject>parseString(specification.getCode(), CodeObject.class))
                .orElseGet(() -> {
                    CodeObject result = new CodeObject();
                    result.setCode(specification.getCode().replace("PolyCustomFunction", resolvedSpecification.getClassName()));
                    result.setClassName(resolvedSpecification.getClassName());
                    return result;
                });
        codeObject.setPackageName(format("%s.delegate", resolvedSpecification.getPackageName()));
        codeObject.setCode(codeObject.getCode().replace("public class", format("@%s\npublic class", PolyGeneratedClass.class.getName())));
        fileService.generateFile(new CustomType(codeObject.getPackageName(), codeObject.getClassName(), format("package %s;\n%s", codeObject.getPackageName(), codeObject.getCode().trim().startsWith("package ") ? codeObject.getCode().substring(codeObject.getCode().indexOf(';') + 1) : codeObject.getCode())), overwriteFiles);
    }

    @Override
    public void visit(ServerVariableSpecification specification) {
        log.trace("Generating code for ServerVariableSpecification.");
        ResolvedServerVariableSpecification resolvedSpecification = resolver.resolve(specification);
        fileService.generateFile(resolvedSpecification, overwriteFiles);
        new TypeCodeGeneratorVisitor(fileService, jsonParser, jsonSchemaParser, specification.getTypeName(), resolvedSpecification.getPackageName(), overwriteFiles)
                .doVisit(specification.getVariable());
    }

    @Override
    public void visit(WebhookHandleSpecification specification) {
        log.trace("Generating code for WebhookHandleSpecification.");
        ResolvedWebhookHandleSpecification resolvedSpecification = resolver.resolve(specification);
        fileService.generateFile(resolvedSpecification, overwriteFiles);
        FunctionPolyType.class.cast(specification.getFunction().getArguments().get(0).getType()).getSpec().getArguments().get(0).accept(new TypeCodeGeneratorVisitor(fileService, jsonParser, jsonSchemaParser,resolvedSpecification.getClassName() + "Event", resolvedSpecification.getPackageName(), overwriteFiles));
    }
}
