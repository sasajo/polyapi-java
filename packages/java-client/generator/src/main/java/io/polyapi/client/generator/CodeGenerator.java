package io.polyapi.client.generator;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.github.jknack.handlebars.Handlebars;
import io.polyapi.client.generator.generator.ClientInfoClassGenerator;
import io.polyapi.client.generator.generator.PolyContextClassGenerator;
import io.polyapi.client.generator.generator.VariContextClassGenerator;
import io.polyapi.client.internal.file.FileService;
import io.polyapi.client.internal.file.FileServiceImpl;
import io.polyapi.client.internal.http.DefaultHttpClient;
import io.polyapi.client.internal.http.TokenProvider;
import io.polyapi.client.internal.parse.JacksonJsonParser;
import io.polyapi.client.internal.parse.JsonParser;
import io.polyapi.client.internal.service.SpecificationApiService;
import io.polyapi.client.internal.service.SpecificationApiServiceImpl;
import okhttp3.OkHttpClient;

import java.io.File;

public class CodeGenerator {
  private final JsonParser jsonParser;
  private final String host;
  private final Integer port;
  private final TokenProvider tokenProvider;
  private final SpecificationApiService specificationApiService;
  private final ClientInfoClassGenerator clientInfoClassGenerator;
  private final PolyContextClassGenerator polyContextClassGenerator;
  private final VariContextClassGenerator variContextClassGenerator;

  private final FileService fileService = new FileServiceImpl();

  public CodeGenerator(String host, Integer port, TokenProvider tokenProvider) {
    this.host = host;
    this.port = port;
    Handlebars handlebars = new Handlebars();
    this.clientInfoClassGenerator = new ClientInfoClassGenerator(handlebars, fileService);
    this.polyContextClassGenerator = new PolyContextClassGenerator(handlebars, fileService);
    this.variContextClassGenerator = new VariContextClassGenerator(handlebars, fileService);
    this.tokenProvider = tokenProvider;
    this.jsonParser = new JacksonJsonParser(new ObjectMapper());
    this.specificationApiService = new SpecificationApiServiceImpl(host, port, new DefaultHttpClient(new OkHttpClient(), tokenProvider), jsonParser);
  }

  // FIXME: This should not throw IOException.
  public void generate() {
    var specifications = specificationApiService.getJsonSpecs();
    clientInfoClassGenerator.generate(host, port, tokenProvider.getToken());
    fileService.createFileWithContent(new File(new File("target/.poly"), "specs.json"), jsonParser.toJsonString(specifications));
    polyContextClassGenerator.generate(specifications);
    variContextClassGenerator.generate(specifications);
  }
}
