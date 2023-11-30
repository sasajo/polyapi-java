package io.polyapi.client.internal.file;

import io.polyapi.client.error.PolyApiClientException;

import java.io.File;
import java.io.FileNotFoundException;
import java.io.PrintWriter;

import static java.lang.String.format;

public class FileServiceImpl implements FileService{

  public void createFileWithContent(File file, String content) {
    try (PrintWriter out = new PrintWriter(file)) {
      file.getParentFile().mkdirs();
      out.println(content);
    } catch (FileNotFoundException e) {
      throw new PolyApiClientException(format("An exception occurred while creating file %s.", file.getAbsolutePath()), e);
    }
  }
}
