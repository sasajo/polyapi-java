package io.polyapi.client.generator;

import java.io.File;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.PrintWriter;

import com.github.jknack.handlebars.Handlebars;

public class AbstractClassGenerator {
  protected final static String PACKAGE_NAME_BASE = "io.polyapi";
  private final Handlebars handlebars = new TemplateGenerator();

  protected void saveClassToFile(String content, String packagePath, String className) {
    try (PrintWriter out = new PrintWriter(new File(getClassDirectory(packagePath), className + ".java"))) {
      out.println(content);
    } catch (FileNotFoundException e) {
      throw new RuntimeException(e);
    }
  }

  protected File getClassDirectory(String packagePath) {
    var directory = new File("target/generated-sources/" + packagePath.replace('.', '/'));
    directory.mkdirs();
    return directory;
  }

  protected Handlebars getHandlebars() {
    return handlebars;
  }
}
