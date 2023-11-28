package io.polyapi.client.generator;

import java.io.IOException;
import java.util.HashMap;
import java.util.UUID;

public class ClientInfoClassGenerator extends AbstractClassGenerator {
  public void generate(String apiBaseUrl, String apiKey) throws IOException {
    var context = new HashMap<String, Object>();
    context.put("clientID", UUID.randomUUID().toString());
    context.put("apiBaseUrl", apiBaseUrl);
    context.put("apiKey", apiKey);
    context.put("packageName", PACKAGE_NAME_BASE);

    saveClassToFile(getHandlebars().compile("clientInfo").apply(context), PACKAGE_NAME_BASE, "ClientInfo");
  }
}
