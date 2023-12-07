package io.polyapi.plugin.service.generator;

import com.github.jknack.handlebars.Handlebars;
import io.polyapi.commons.api.service.file.FileService;
import lombok.Getter;

import static lombok.AccessLevel.PROTECTED;

@Getter(PROTECTED)
public class AbstractClassGenerator {
  protected final static String PACKAGE_NAME_BASE = "io.polyapi";
  private final Handlebars handlebars;
  private final FileService fileService;

  public AbstractClassGenerator(Handlebars handlebars, FileService fileService) {
    this.handlebars = handlebars;
    this.fileService = fileService;
  }
}
