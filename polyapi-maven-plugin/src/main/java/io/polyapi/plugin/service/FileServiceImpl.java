package io.polyapi.plugin.service;

import com.github.jknack.handlebars.Handlebars;
import io.polyapi.commons.api.error.PolyApiException;
import io.polyapi.plugin.service.template.PolyHandlebars;
import lombok.extern.slf4j.Slf4j;

import java.io.File;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.PrintWriter;

import static java.lang.String.format;

@Slf4j
public class FileServiceImpl implements FileService {
    private final Handlebars handlebars = new PolyHandlebars();

    public void createFileFromTemplate(File file, String template, Object context, boolean overwriteFiles) {
        try {
            log.debug("Creating file content using template {}.", template);
            var content = handlebars.compile(template).apply(context);
            log.trace("Content created:\n{}", content);
            createFileWithContent(file, content, overwriteFiles);
        } catch (IOException e) {
            // FIXME: Throw appropriate exception.
            throw new PolyApiException(format("An exception occurred while creating content for template %s.", template), e);
        }
    }

    public void createFileWithContent(File file, String content, boolean overwriteFiles) {
        if (file.exists() && !overwriteFiles) {
            log.debug("File {} already exists. Skipping its creation.", file.getAbsolutePath());
        } else {
            log.debug("Creating file with content for file {}.", file.getAbsolutePath());
            File parent = file.getParentFile();
            log.debug("Creating parent folder at {}.", parent.getAbsolutePath());
            parent.mkdirs();
            try (PrintWriter out = new PrintWriter(file)) {
                out.println(content);
            } catch (FileNotFoundException e) {
                // FIXME: Throw appropriate exception.
                throw new PolyApiException(format("An exception occurred while creating file %s.", file.getAbsolutePath()), e);
            } finally {
                log.debug("File {} created successfully.", file.getAbsolutePath());
            }
        }
    }
}
