package io.polyapi.commons.api.service.file;

import java.io.File;

public interface FileService {
  String DEFAULT_PACKAGE_NAME_BASE = "io.polyapi";

  default void createClassFileWithDefaultPackage(String className, String template, Object context) {
    createClassFile(DEFAULT_PACKAGE_NAME_BASE, className, template, context);
  }

  default void createClassFile(String classPackage, String className, String template, Object context) {
    createFileFromTemplate(new File(new File("target/generated-sources/" + classPackage.replace('.', '/')), className + ".java"), template, context);
  }

  /**
   * Creates a file, its parent directory and adds contents to it.
   *
   * @param file    The {@link File} to write.
   * @param content The contents of the file.
   */
  void createFileWithContent(File file, String content);

  /**
   * Creates a file, its parent directory and adds contents to it. The contents are created from a template and a context.
   *
   * @param file     The {@link File} to write.
   * @param template The name of the template of the content of the file.
   * @param context  The context which, provided to the template, will form the content of the file.
   */
  void createFileFromTemplate(File file, String template, Object context);
}
