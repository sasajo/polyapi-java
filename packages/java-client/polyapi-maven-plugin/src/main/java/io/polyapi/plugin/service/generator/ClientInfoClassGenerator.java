package io.polyapi.plugin.service.generator;

import com.github.jknack.handlebars.Handlebars;
import io.polyapi.commons.api.service.file.FileService;

import java.io.IOException;
import java.util.HashMap;
import java.util.UUID;

import static java.lang.String.format;

public class ClientInfoClassGenerator extends AbstractClassGenerator {

  public ClientInfoClassGenerator(Handlebars handlebars, FileService fileService) {
    super(handlebars, fileService);
  }

  public void generate(String apiBaseUrl, Integer port, String apiKey) {
    try {
      var context = new HashMap<String, Object>();
      // @FIXME: Are we sure we want to set this ID at this level?
      context.put("clientID", UUID.randomUUID().toString());
      context.put("apiBaseUrl", format("%s:%s", apiBaseUrl, port));
      context.put("apiKey", apiKey);
      context.put("packageName", PACKAGE_NAME_BASE);
      getFileService().createClassFileWithDefaultPackage("ClientInfo", getHandlebars().compile("clientInfo").apply(context));
    } catch (IOException e) {
      // FIXME: Throw the appropriate exception.
      throw new RuntimeException(e);
    }
  }
}
