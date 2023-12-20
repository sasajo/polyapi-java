package io.polyapi.plugin.service.generator;

import io.polyapi.commons.api.service.file.FileService;
import lombok.Getter;

import static lombok.AccessLevel.PROTECTED;

@Deprecated
@Getter(PROTECTED)
public class AbstractClassGenerator {
  protected final static String PACKAGE_NAME_BASE = "io.polyapi";
  private final FileService fileService;

  public AbstractClassGenerator(FileService fileService) {
    this.fileService = fileService;
  }
}
