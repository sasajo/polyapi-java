package io.polyapi.plugin.service.visitor;

import io.polyapi.commons.api.service.file.FileService;
import io.polyapi.plugin.model.generation.Generable;
import lombok.Getter;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import static lombok.AccessLevel.PROTECTED;

@Getter(PROTECTED)
@Slf4j
public class CodeGenerator {

    private final FileService fileService;

    public CodeGenerator(FileService fileService) {
        this.fileService = fileService;
    }

    public void generate(Generable generable) {
        generate(generable, generable.getClass().getSimpleName());
    }

    public void generate(Generable generable, String template) {
        log.debug("Attempting to write {} with template {} on package {}.", generable.getClassName(), template, generable.getPackageName());
        fileService.createClassFile(generable.getPackageName(), generable.getClassName(), template, generable);
    }
}
