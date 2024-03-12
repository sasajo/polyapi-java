package io.polyapi.plugin.service.visitor;

import io.polyapi.commons.api.json.JsonParser;
import io.polyapi.commons.api.model.PolyGeneratedClass;
import io.polyapi.commons.api.service.file.FileService;
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
import io.polyapi.plugin.service.generation.PolyObjectResolverService;
import io.polyapi.plugin.service.schema.JsonSchemaParser;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Optional;

import static java.lang.String.format;

public class SpecificationCodeGeneratorVisitor extends CodeGenerator implements PolySpecificationVisitor {
    private static final Logger logger = LoggerFactory.getLogger(SpecificationCodeGeneratorVisitor.class);

    private final JsonSchemaParser jsonSchemaParser;
    private final JsonParser jsonParser;
    private final PolyObjectResolverService resolver;

    public SpecificationCodeGeneratorVisitor(FileService fileService, PolyObjectResolverService resolver, JsonParser jsonParser, JsonSchemaParser jsonSchemaParser) {
        super(fileService);
        this.resolver = resolver;
        this.jsonParser = jsonParser;
        this.jsonSchemaParser = jsonSchemaParser;
    }

    @Override
    public void doVisit(Specification specification) {
        logger.debug("Generating code for {} specification '{}' on context '{}'.", specification.getType(), specification.getName(), specification.getContext());
        PolySpecificationVisitor.super.doVisit(specification);
        logger.debug("Code for {} specification '{}' on context '{}' generated.", specification.getType(), specification.getName(), specification.getContext());
    }

    @Override
    public void visit(FunctionSpecification specification) {
        logger.trace("Generating code for FunctionSpecification.");
        PolyObjectResolverVisitor visitor = new PolyObjectResolverVisitor(resolver);
        visitor.doVisit(specification);
        ResolvedSpecification resolvedSpecification = visitor.getResult();
        generate(resolvedSpecification);
        new TypeCodeGeneratorVisitor(resolvedSpecification.getClassName(), resolvedSpecification.getPackageName(), getFileService(), jsonParser, jsonSchemaParser).doVisit(specification.getFunction());
    }

    public void visit(ServerFunctionSpecification specification) {
        logger.trace("Generating code for ServerFunctionSpecification.");
        visit(FunctionSpecification.class.cast(specification));
    }

    @Override
    public void visit(CustomFunctionSpecification specification) {
        logger.trace("Generating code for CustomFunctionSpecification.");
        ResolvedCustomFunctionSpecification resolvedSpecification = resolver.resolve(specification);
        generate(resolvedSpecification);
        specification.getFunction().accept(new TypeCodeGeneratorVisitor(resolvedSpecification.getClassName(), resolvedSpecification.getPackageName(), getFileService(), jsonParser, jsonSchemaParser));
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
        generate(new CustomType(codeObject.getPackageName(), codeObject.getClassName(), format("package %s;\n%s", codeObject.getPackageName(), codeObject.getCode().trim().startsWith("package ") ? codeObject.getCode().substring(codeObject.getCode().indexOf(';') + 1) : codeObject.getCode())));
    }

    @Override
    public void visit(ServerVariableSpecification specification) {
        logger.trace("Generating code for ServerVariableSpecification.");
        ResolvedServerVariableSpecification resolvedSpecification = resolver.resolve(specification);
        generate(resolvedSpecification);
        new TypeCodeGeneratorVisitor(specification.getTypeName(), resolvedSpecification.getPackageName(), getFileService(), jsonParser, jsonSchemaParser)
                .doVisit(specification.getVariable());
    }

    @Override
    public void visit(WebhookHandleSpecification specification) {
        logger.trace("Generating code for WebhookHandleSpecification.");
        ResolvedWebhookHandleSpecification resolvedSpecification = resolver.resolve(specification);
        generate(resolvedSpecification);
        FunctionPolyType.class.cast(specification.getFunction().getArguments().get(0).getType()).getSpec().getArguments().get(0).accept(new TypeCodeGeneratorVisitor(resolvedSpecification.getClassName() + "Event", resolvedSpecification.getPackageName(), getFileService(), jsonParser, jsonSchemaParser));
    }
}
