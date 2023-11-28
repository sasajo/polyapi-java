package io.polyapi.client.generator;

import java.io.File;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.PrintWriter;

import io.polyapi.client.model.specification.ServerVariableSpecification;
import io.polyapi.client.parser.SpecsParser;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.Response;

public class CodeGenerator {
  private OkHttpClient client = new OkHttpClient();
  private ClientInfoClassGenerator clientInfoClassGenerator = new ClientInfoClassGenerator();
  private PolyContextClassGenerator polyContextClassGenerator = new PolyContextClassGenerator();
  private VariContextClassGenerator variContextClassGenerator = new VariContextClassGenerator();

  // FIXME: This should not throw IOException.
  public void generate(String apiBaseUrl, String apiKey) throws FileNotFoundException, IOException {
    String specsJSON;
    try (Response response = client.newCall(new Request.Builder()
      .url(apiBaseUrl + "/specs")
      .header("Authorization", "Bearer " + apiKey)
      .build()).execute()) {
      if (!response.isSuccessful()) {

        // FIXME: This should be a specific exception.
        throw new RuntimeException("Error while setting Poly specifications: " + response.code() + " " + response.message());
      }
      specsJSON = response.body().string();
    }

    var specifications = new SpecsParser().parseSpecs(specsJSON);

    clientInfoClassGenerator.generate(apiBaseUrl, apiKey);
    polyContextClassGenerator.generate(specifications);
    variContextClassGenerator.generate(
      specifications.stream()
        .filter(ServerVariableSpecification.class::isInstance)
        .map(ServerVariableSpecification.class::cast)
        .toList()
    );
    var targetDir = new File("target/.poly");
    if (!targetDir.exists()) {
      if (!targetDir.mkdirs()) {
        // FIXME: This should be a specific IO Exception.
        throw new IOException("Could not create directory: " + targetDir.getAbsolutePath());
      }
    }
    try (PrintWriter out = new PrintWriter(new File(targetDir, "specs.json"))) {
      out.println(specsJSON);
    }
  }
}
