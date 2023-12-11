package io.polyapi.commons.internal.file;

import io.polyapi.commons.api.error.PolyApiException;
import io.polyapi.commons.api.service.file.FileService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.File;
import java.io.FileNotFoundException;
import java.io.PrintWriter;
import java.util.Optional;

import static java.lang.String.format;

public class FileServiceImpl implements FileService {
  private static final Logger logger = LoggerFactory.getLogger(FileServiceImpl.class);

  public void createFileWithContent(File file, String content) {
    Optional.ofNullable(file).map(File::getAbsolutePath).orElseThrow(NullPointerException::new);
    logger.debug("Creating file with content for file {}.", file.getAbsolutePath());
    File parent = file.getParentFile();
    logger.debug("Creating parent folder at {}.", parent.getAbsolutePath());
    if (!parent.exists() && !parent.mkdirs()) {
      // FIXME: Throw appropriate exception.
      throw new PolyApiException(format("Parent file of file '%s' not created .", file.getParentFile().getAbsolutePath()));
    }
    try (PrintWriter out = new PrintWriter(file)) {
      out.println(content);
    } catch (FileNotFoundException e) {
      // FIXME: Throw appropriate exception.
      throw new PolyApiException(format("An exception occurred while creating file %s.", file.getAbsolutePath()), e);
    }
  }
}
