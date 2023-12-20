package io.polyapi.plugin.service.generator;

import io.polyapi.commons.api.service.file.FileService;
import io.polyapi.plugin.model.Generable;
import io.polyapi.plugin.model.LibraryTreeNode;
import io.polyapi.plugin.model.property.FunctionPropertyType;
import io.polyapi.plugin.model.property.ObjectPropertyType;
import io.polyapi.plugin.model.specification.Context;
import io.polyapi.plugin.model.specification.Specification;
import io.polyapi.plugin.model.specification.function.ApiFunctionSpecification;
import io.polyapi.plugin.model.specification.function.CustomFunctionSpecification;
import io.polyapi.plugin.model.specification.function.FunctionMetadata;
import io.polyapi.plugin.model.specification.function.PropertyMetadata;
import io.polyapi.plugin.model.specification.function.ServerFunctionSpecification;
import io.polyapi.plugin.model.specification.function.WebhookHandleSpecification;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Stream;

import static io.polyapi.plugin.utils.StringUtils.toPascalCase;
import static java.util.function.Predicate.not;

@Deprecated
public class PolyContextClassGenerator extends SpecificationClassGenerator<Specification> {
  private static final Logger logger = LoggerFactory.getLogger(PolyContextClassGenerator.class);

  private final LibraryTreeNode<Specification> root = new LibraryTreeNode<>("Poly", true);

  public PolyContextClassGenerator(FileService fileService) {
    super(fileService);
  }

  public void generate(Collection<Specification> specifications) {
    logger.info("Generating files for {} specifications.", Optional.ofNullable(specifications).map(Collection::size).orElse(0));
    var polyContext = new Context(null, "Poly");
    logger.debug("Creating root context.");
    specifications.stream()
      .peek(specification -> logger.trace("Generating context for specification {}.", specification.getName()))
      .forEach(specification -> createPolyContext(polyContext, Stream.of(specification.getContext().split("\\.")).filter(not(String::isEmpty)).toList(), specification));
    polyContext.getSubcontexts().forEach(this::generateFiles);

    writeContent("io.polyapi", "Poly", polyContext);
//    specifications.forEach(this::insertIntoTree);
//    generateClassesFromTree(root, PACKAGE_NAME_BASE + ".poly");


  }

  private void generateFiles(Context context) {
    writeContent(context.getPackageName(), "contextClass", context);
    context.getSpecifications().forEach(specification -> {
      logger.info("Writing specification {}.", specification.getName());
      writeContent(specification);
    });
    context.getSubcontexts().stream().forEach(this::generateFiles);
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

  private void generateClassesFromTree(LibraryTreeNode<Specification> node, String currentPackage) {
    var context = new HashMap<String, Object>();
    var className = toPascalCase(node.getContext());
    context.put("packageName", node.isRoot() ? PACKAGE_NAME_BASE : currentPackage);
    context.put("className", className);
    context.put("subContexts", node.getSubContexts().values().stream()
      .map(subContext -> {
        Map<String, Object> result = new HashMap<>();
        var subcontextClassName = toPascalCase(subContext.getContext());
        result.put("name", subContext.getContext());
        result.put("className", node.isRoot() ? currentPackage + "." + subcontextClassName : currentPackage + "." + subcontextClassName.toLowerCase() + "." + subcontextClassName);
        result.put("useStatic", node.isRoot());
        return result;
      })
      .toList());
    context.put("specifications", node.getSpecifications());
    context.put("useStatic", node.isRoot());
    var specifications = node.getSpecifications();
    for (var specification : specifications) {
      if (specification instanceof ApiFunctionSpecification apiFunctionSpecification) {
        generateFunctionTypeClasses(specification, apiFunctionSpecification.getFunction(), currentPackage);
      }
      if (specification instanceof CustomFunctionSpecification customFunctionSpecification && customFunctionSpecification.isJava()) {
        writeContent(specification);
      }
      if (specification instanceof WebhookHandleSpecification webhookHandleSpecification) {
        var type = (FunctionPropertyType.class.cast(webhookHandleSpecification.getFunction().getArguments().get(0).getType()).getSpec().getArguments().get(0).getType());
        if (type instanceof ObjectPropertyType) {
          generateObjectPropertyType(currentPackage, (ObjectPropertyType) type, toPascalCase(specification.getName()) + "$EventType");
        }
      }
      if (specification instanceof ServerFunctionSpecification) {
        writeContent(specification);
      }
    }
    getFileService().createClassFile(node.isRoot() ? PACKAGE_NAME_BASE : currentPackage, className, "polyContextClass", context);

    for (Map.Entry<String, LibraryTreeNode<Specification>> entry : node.getSubContexts().entrySet()) {
      var subContextPackage = node.isRoot() ? currentPackage : currentPackage + "." + entry.getKey().toLowerCase();
      generateClassesFromTree(entry.getValue(), subContextPackage);
    }
  }

  private void generateFunctionTypeClasses(Specification specification, FunctionMetadata functionMetadata, String packageName) {
    if (functionMetadata.getReturnType() instanceof ObjectPropertyType returnType) {
      generateObjectPropertyType(packageName, returnType, toPascalCase(specification.getName()) + "$ReturnType");
    }

    for (PropertyMetadata argument : functionMetadata.getArguments()) {
      if (argument.getType() instanceof ObjectPropertyType argumentType) {
        generateObjectPropertyType(packageName, argumentType, toPascalCase(specification.getName()) + "$" + toPascalCase(argument.getName()));
      }
    }
  }

  private void writeContent(Generable generable) {
    writeContent(generable.getPackageName(), generable.getClass().getSimpleName(), generable);
  }

  private void writeContent(String packageName, String template, Generable generable) {
    getFileService().createClassFile(packageName, generable.getClassName(), template, generable);
  }

  @Override
  public LibraryTreeNode<Specification> getRoot() {
    return root;
  }
}
