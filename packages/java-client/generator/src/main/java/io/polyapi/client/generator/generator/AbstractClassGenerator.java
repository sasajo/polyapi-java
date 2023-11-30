package io.polyapi.client.generator.generator;

import com.github.jknack.handlebars.Handlebars;
import io.polyapi.client.generator.generator.template.TemplateGenerator;
import io.polyapi.client.internal.file.FileService;
import io.polyapi.client.internal.file.FileServiceImpl;
import lombok.Getter;

import static lombok.AccessLevel.PROTECTED;

@Getter(PROTECTED)
public class AbstractClassGenerator {
  protected final static String PACKAGE_NAME_BASE = "io.polyapi";
  private final Handlebars handlebars = new TemplateGenerator();
  private FileService fileService = new FileServiceImpl();
}
