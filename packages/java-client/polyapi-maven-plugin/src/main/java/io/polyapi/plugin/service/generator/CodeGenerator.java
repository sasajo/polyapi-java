package io.polyapi.plugin.service.generator;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.github.jknack.handlebars.Handlebars;
import io.polyapi.commons.api.service.file.FileService;
import io.polyapi.commons.api.http.TokenProvider;
import io.polyapi.commons.api.json.JsonParser;
import io.polyapi.commons.internal.file.FileServiceImpl;
import io.polyapi.commons.internal.http.DefaultHttpClient;
import io.polyapi.commons.internal.json.JacksonJsonParser;
import io.polyapi.plugin.service.SpecificationApiService;
import io.polyapi.plugin.service.SpecificationApiServiceImpl;
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
