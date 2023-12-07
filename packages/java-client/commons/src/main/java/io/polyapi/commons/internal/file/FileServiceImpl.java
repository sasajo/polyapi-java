package io.polyapi.commons.internal.file;

import io.polyapi.commons.api.error.PolyApiException;
import io.polyapi.commons.api.file.FileService;

import java.io.File;
import java.io.FileNotFoundException;
import java.io.PrintWriter;
import java.util.Optional;

import static java.lang.String.format;

public class FileServiceImpl implements FileService {

  public void createFileWithContent(File file, String content) {
    try (PrintWriter out = new PrintWriter(file)) {
      if (!file.getParentFile().mkdirs()) {
        throw new PolyApiException(format("Parent file not created of file %s.", Optional.ofNullable(file)
          .map(File::getParentFile)
          .map(File::getAbsolutePath)
          .orElse("null")));
      }
      out.println(content);
    } catch (FileNotFoundException e) {
      throw new PolyApiException(format("An exception occurred while creating file %s.", file.getAbsolutePath()), e);
    }
  }
}
