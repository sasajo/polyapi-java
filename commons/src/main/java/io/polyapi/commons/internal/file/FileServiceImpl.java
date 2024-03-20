package io.polyapi.commons.internal.file;

import com.github.jknack.handlebars.Handlebars;
import io.polyapi.commons.api.error.PolyApiException;
import io.polyapi.commons.api.service.file.FileService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.File;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.PrintWriter;

import static java.lang.String.format;

public class FileServiceImpl implements FileService {
  private static final Logger log = LoggerFactory.getLogger(FileServiceImpl.class);
  private final Handlebars handlebars;
  private final boolean overwriteFiles;


  public FileServiceImpl(Handlebars handlebars, boolean overwriteFiles) {
    this.handlebars = handlebars;
    this.overwriteFiles = overwriteFiles;
  }

  public void createFileFromTemplate(File file, String template, Object context) {
    try {
      log.debug("Creating file content using template {}.", template);
      var content = handlebars.compile(template).apply(context);
      log.trace("Content created:\n{}", content);
      createFileWithContent(file, content);
    } catch (IOException e) {
      // FIXME: Throw appropriate exception.
      throw new PolyApiException(format("An exception occurred while creating content for template %s.", template), e);
    }
  }

  public void createFileWithContent(File file, String content) {
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
