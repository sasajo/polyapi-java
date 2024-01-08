package io.polyapi.plugin.service.visitor;

import io.polyapi.commons.api.service.file.FileService;
import io.polyapi.plugin.model.CustomType;
import io.polyapi.plugin.model.Generable;
import io.polyapi.plugin.model.specification.Context;
import io.polyapi.plugin.model.specification.Specification;
import io.polyapi.plugin.model.specification.function.CustomFunctionSpecification;
import io.polyapi.plugin.model.specification.function.FunctionSpecification;
import io.polyapi.plugin.service.JsonSchemaParser;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import static java.lang.String.format;

public class CodeGenerationVisitor implements PolyVisitor{
    private static final Logger logger = LoggerFactory.getLogger(CodeGenerationVisitor.class);

    private final FileService fileService;
    private final JsonSchemaParser jsonSchemaParser;

    public CodeGenerationVisitor(FileService fileService, JsonSchemaParser jsonSchemaParser) {
        this.fileService = fileService;
        this.jsonSchemaParser = jsonSchemaParser;
    }

    private void generate(Generable generable) {
        generate(generable, generable.getClass().getSimpleName());
    }

    private void generate(Generable generable, String template) {
        logger.info("Writing {} with template {} on package {}.", generable.getClassName(), template, generable.getPackageName());
        fileService.createClassFile(generable.getPackageName(), generable.getClassName(), template, generable);
    }

    @Override
    public void visit(Specification specification) {
        logger.debug("CodeGenerationVisitor visiting specification {}", specification.getName());
        generate(specification);
    }

    @Override
    public void visit(FunctionSpecification specification) {
        visit((Specification) specification);
        jsonSchemaParser.generateReturnClassStructure(specification).forEach(this::generate);
    }

    @Override
    public void visit(CustomFunctionSpecification specification) {
        if (specification.isJava()) {
            visit((FunctionSpecification) specification);
            new CustomType(specification.getPackageName(), format("%sDelegate", specification.getClassName()), specification.getCode()).accept(this);
        }
    }

    @Override
    public void visit(Context context) {
        if (context.getParent() == null) {
            generate(context, context.getClassName());
        } else {
            generate(context);
        }
        context.getSubcontexts().forEach(subcontext -> subcontext.accept(this));
        context.getSpecifications().forEach(specification -> specification.accept(this));
    }

    @Override
    public void visit(CustomType customType) {
        generate(customType);
    }
}
