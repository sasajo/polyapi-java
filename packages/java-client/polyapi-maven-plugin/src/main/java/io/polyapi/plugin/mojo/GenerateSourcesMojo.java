package io.polyapi.plugin.mojo;


import com.github.jknack.handlebars.Handlebars;
import io.polyapi.commons.api.http.HttpClient;
import io.polyapi.commons.api.http.TokenProvider;
import io.polyapi.commons.api.json.JsonParser;
import io.polyapi.commons.api.service.file.FileService;
import io.polyapi.commons.internal.file.FileServiceImpl;
import io.polyapi.plugin.model.Generable;
import io.polyapi.plugin.model.specification.Context;
import io.polyapi.plugin.model.specification.Specification;
import io.polyapi.plugin.service.MavenService;
import io.polyapi.plugin.service.SpecificationServiceImpl;
import io.polyapi.plugin.service.generator.ClientInfoClassGenerator;
import io.polyapi.plugin.service.generator.VariContextClassGenerator;
import io.polyapi.plugin.service.generator.template.TemplateGenerator;
import lombok.Setter;
import org.apache.maven.plugins.annotations.Mojo;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.File;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.util.List;
import java.util.function.Consumer;
import java.util.function.Function;
import java.util.stream.Stream;

import static java.util.function.Predicate.not;

@Mojo(name = "generate-sources")
@Setter
public class GenerateSourcesMojo extends PolyApiMojo {
  private static final Logger logger = LoggerFactory.getLogger(GenerateSourcesMojo.class);
  private FileService fileService;
  private Handlebars handlebars;

  @Override
  public void execute(String host, Integer port, TokenProvider tokenProvider, HttpClient httpClient, JsonParser jsonParser, MavenService mavenService) {
    this.fileService = new FileServiceImpl();
    this.handlebars = new TemplateGenerator();
    var specifications = new SpecificationServiceImpl(host, port, httpClient, jsonParser).getJsonSpecs();
    new ClientInfoClassGenerator(handlebars, fileService).generate(host, port, tokenProvider.getToken());
    fileService.createFileWithContent(new File(new File("target/.poly"), "specs.json"), jsonParser.toJsonString(specifications));



    var polyContext = new Context(null, "Poly");
    logger.debug("Creating root context.");
    specifications.stream()
      .peek(specification -> logger.trace("Generating context for specification {}.", specification.getName()))
      .forEach(specification -> createPolyContext(polyContext, Stream.of(specification.getContext().split("\\.")).filter(not(String::isEmpty)).toList(), specification));
    writeContent("Poly", polyContext);
    writeChildrenContent(polyContext);



    new VariContextClassGenerator(handlebars, fileService).generate(specifications);
  }

  private void writeChildrenContent(Context context) {
    context.getSpecifications().forEach(this::writeContent);
    context.getSubcontexts().stream()
      .peek(this::writeContent)
      .forEach(this::writeChildrenContent);
  }

  private Context createPolyContext(Context parent, List<String> contextList, Specification specification) {
    if (contextList.isEmpty()) {
      logger.debug("Adding specification to context {}.", parent.getName());
      parent.getSpecifications().add(specification);
      return parent;
    } else {
      var contextName = contextList.get(0);
      logger.debug("Retrieving context {}.", contextName);
      return createPolyContext(parent.put(new Context(parent, contextName)),
        contextList.subList(1, contextList.size()),
        specification);
    }
  }

  private void writeContent(Generable generable) {
    writeContent(generable.getClass().getSimpleName(), generable);
  }

  private void writeContent(String template, Generable generable) {
    try {
      logger.info("Writing {} with template {} on package {}.", generable.getClassName(), template, generable.getPackageName());
      fileService.createClassFile(generable.getPackageName(), generable.getClassName(), handlebars.compile(template).apply(generable));
    } catch (FileNotFoundException e) {
      logger.warn("File not found: {}", e.getMessage());
    } catch (IOException e) {
      // FIXME: Throw appropriate exception.
      throw new RuntimeException(e);
    }
  }

}
