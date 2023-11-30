package io.polyapi.client.internal.file;

import java.io.File;

public interface FileService {
  String DEFAULT_PACKAGE_NAME_BASE = "io.polyapi";

  default void createClassFileWithDefaultPackage(String className, String content) {
    createClassFile(DEFAULT_PACKAGE_NAME_BASE, className, content);
  }

    default void createClassFile(String classPackage, String className, String content) {
    createFileWithContent(new File(new File("target/generated-sources/" + classPackage.replace('.', '/')), className + ".java"), content);
  }

  /**
   * Creates a file, its parent directory and adds contents to it.
   * This method wraps all exceptions thrown into RuntimeExceptions.
   * @param file
   * @param content
   */
  void createFileWithContent(File file, String content);
}
