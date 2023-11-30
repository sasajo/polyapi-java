package io.polyapi.client.generator;

import io.polyapi.client.generator.generator.ClientInfoClassGenerator;
import io.polyapi.client.generator.generator.PolyContextClassGenerator;
import io.polyapi.client.generator.generator.VariContextClassGenerator;
import io.polyapi.client.internal.file.FileService;
import io.polyapi.client.internal.file.FileServiceImpl;
import io.polyapi.client.internal.http.SpecificationApiService;
import io.polyapi.client.internal.http.SpecificationApiServiceImpl;
import io.polyapi.client.parser.SpecsParser;
import okhttp3.OkHttpClient;

import java.io.File;
import java.io.FileNotFoundException;
import java.io.IOException;

public class CodeGenerator {
  private SpecificationApiService specificationApiService = new SpecificationApiServiceImpl(new OkHttpClient());
  private ClientInfoClassGenerator clientInfoClassGenerator = new ClientInfoClassGenerator();
  private PolyContextClassGenerator polyContextClassGenerator = new PolyContextClassGenerator();
  private VariContextClassGenerator variContextClassGenerator = new VariContextClassGenerator();

  private FileService fileService = new FileServiceImpl();

  // FIXME: This should not throw IOException.
  public void generate(String apiBaseUrl, String apiKey) throws FileNotFoundException, IOException {
    var specifications = specificationApiService.getJsonSpecs(apiBaseUrl, apiKey);
    clientInfoClassGenerator.generate(apiBaseUrl, apiKey);
    fileService.createFileWithContent(new File(new File("target/.poly"), "specs.json"), specifications);
    var specList = new SpecsParser().parseSpecs(specifications);
    polyContextClassGenerator.generate(specList);
    variContextClassGenerator.generate(specList);
  }
}
