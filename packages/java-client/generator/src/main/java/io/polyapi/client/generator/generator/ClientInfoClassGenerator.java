package io.polyapi.client.generator.generator;

import io.polyapi.client.generator.generator.AbstractClassGenerator;

import java.io.File;
import java.io.IOException;
import java.util.HashMap;
import java.util.UUID;

public class ClientInfoClassGenerator extends AbstractClassGenerator {
  public void generate(String apiBaseUrl, String apiKey) throws IOException {
    var context = new HashMap<String, Object>();
    // @FIXME: Are we sure we want to set this ID at this level?
    context.put("clientID", UUID.randomUUID().toString());
    context.put("apiBaseUrl", apiBaseUrl);
    context.put("apiKey", apiKey);
    context.put("packageName", PACKAGE_NAME_BASE);
    getFileService().createClassFileWithDefaultPackage( "ClientInfo", getHandlebars().compile("clientInfo").apply(context));
  }
}
