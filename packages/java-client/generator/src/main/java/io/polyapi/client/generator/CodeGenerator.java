package io.polyapi.client.generator;

import com.fasterxml.jackson.databind.ObjectMapper;
import io.polyapi.client.generator.generator.ClientInfoClassGenerator;
import io.polyapi.client.generator.generator.PolyContextClassGenerator;
import io.polyapi.client.generator.generator.VariContextClassGenerator;
import io.polyapi.client.internal.file.FileService;
import io.polyapi.client.internal.file.FileServiceImpl;
import io.polyapi.client.internal.http.DefaultHttpClient;
import io.polyapi.client.internal.http.TokenProvider;
import io.polyapi.client.internal.parse.JsonParser;
import io.polyapi.client.internal.service.SpecificationApiService;
import io.polyapi.client.internal.service.SpecificationApiServiceImpl;
import okhttp3.OkHttpClient;

import java.io.File;
import java.io.IOException;

public class CodeGenerator {
  private final JsonParser jsonParser;
  private final String host;
  private final Integer port;
  private final TokenProvider tokenProvider;
  private SpecificationApiService specificationApiService;
  private ClientInfoClassGenerator clientInfoClassGenerator = new ClientInfoClassGenerator();
  private PolyContextClassGenerator polyContextClassGenerator = new PolyContextClassGenerator();
  private VariContextClassGenerator variContextClassGenerator = new VariContextClassGenerator();

  private FileService fileService = new FileServiceImpl();

  public CodeGenerator(String host, Integer port, TokenProvider tokenProvider) {
    this.host = host;
    this.port = port;
    this.tokenProvider = tokenProvider;
    this.jsonParser = new JsonParser(new ObjectMapper());
    this.specificationApiService = new SpecificationApiServiceImpl(host, port, new DefaultHttpClient(new OkHttpClient(), tokenProvider), jsonParser);
  }

  // FIXME: This should not throw IOException.
  public void generate() throws IOException {
    var specifications = specificationApiService.getJsonSpecs();
    clientInfoClassGenerator.generate(host, tokenProvider.getToken());
    fileService.createFileWithContent(new File(new File("target/.poly"), "specs.json"), jsonParser.toJsonString(specifications));
    polyContextClassGenerator.generate(specifications);
    variContextClassGenerator.generate(specifications);
  }
}
