package io.polyapi.plugin.mojo;


import com.github.jknack.handlebars.Handlebars;
import io.polyapi.commons.api.http.HttpClient;
import io.polyapi.commons.api.http.TokenProvider;
import io.polyapi.commons.api.json.JsonParser;
import io.polyapi.commons.api.service.file.FileService;
import io.polyapi.commons.internal.file.FileServiceImpl;
import io.polyapi.plugin.service.MavenService;
import io.polyapi.plugin.service.SpecificationApiServiceImpl;
import io.polyapi.plugin.service.generator.ClientInfoClassGenerator;
import io.polyapi.plugin.service.generator.PolyContextClassGenerator;
import io.polyapi.plugin.service.generator.VariContextClassGenerator;
import io.polyapi.plugin.service.generator.template.TemplateGenerator;
import lombok.Setter;
import org.apache.maven.plugins.annotations.Mojo;

import java.io.File;

@Mojo(name = "generate-sources")
@Setter
public class CodeGenerationMojo extends PolyApiMojo {

  @Override
  public void execute(String host, Integer port, TokenProvider tokenProvider, HttpClient httpClient, JsonParser jsonParser, MavenService mavenService) {
    FileService fileService = new FileServiceImpl();
    Handlebars handlebars = new TemplateGenerator();
    var specifications = new SpecificationApiServiceImpl(host, port, httpClient, jsonParser).getJsonSpecs();
    new ClientInfoClassGenerator(handlebars, fileService).generate(host, port, tokenProvider.getToken());
    fileService.createFileWithContent(new File(new File("target/.poly"), "specs.json"), jsonParser.toJsonString(specifications));
    new PolyContextClassGenerator(handlebars, fileService).generate(specifications);
    new VariContextClassGenerator(handlebars, fileService).generate(specifications);
  }
}
