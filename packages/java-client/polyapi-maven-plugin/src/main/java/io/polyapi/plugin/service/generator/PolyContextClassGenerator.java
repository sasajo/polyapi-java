package io.polyapi.plugin.service.generator;

import com.github.jknack.handlebars.Handlebars;
import io.polyapi.commons.api.service.file.FileService;
import io.polyapi.plugin.model.LibraryTreeNode;
import io.polyapi.plugin.model.property.FunctionPropertyType;
import io.polyapi.plugin.model.property.ObjectPropertyType;
import io.polyapi.plugin.model.specification.ApiFunctionSpecification;
import io.polyapi.plugin.model.specification.CustomFunctionSpecification;
import io.polyapi.plugin.model.specification.FunctionSpecification;
import io.polyapi.plugin.model.specification.PropertySpecification;
import io.polyapi.plugin.model.specification.Specification;
import io.polyapi.plugin.model.specification.WebhookHandleSpecification;
import io.polyapi.plugin.utils.StringUtils;

import java.io.IOException;
import java.util.Collection;
import java.util.HashMap;
import java.util.Map;

public class PolyContextClassGenerator extends SpecificationClassGenerator<Specification> {

  private final LibraryTreeNode<Specification> root = new LibraryTreeNode<>("Poly", true);

  public PolyContextClassGenerator(Handlebars handlebars, FileService fileService) {
    super(handlebars, fileService);
  }

  public void generate(Collection<Specification> specifications) {
    for (Specification spec : specifications) {
      insertIntoTree(root, spec);
    }

    generateClassesFromTree(root, PACKAGE_NAME_BASE + ".poly");
  }

  private void generateClassesFromTree(LibraryTreeNode<Specification> node, String currentPackage) {
    try {
      var context = new HashMap<String, Object>();
      var template = getHandlebars().compile("polyContextClass");
      var className = StringUtils.toPascalCase(node.getContext());

      context.put("packageName", node.isRoot() ? PACKAGE_NAME_BASE : currentPackage);
      context.put("className", className);

      context.put("subContexts", node.getSubContexts().values().stream()
        .map(subContext -> {
          Map<String, Object> result = new HashMap<>();
          var subcontextClassName = StringUtils.toPascalCase(subContext.getContext());
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
          var customFunctionSpecificationClassName = customFunctionSpecification.getClassName();
          var classContent = "package " + currentPackage + ";\n\n" + customFunctionSpecification.getCode();
          getFileService().createClassFile(currentPackage, customFunctionSpecificationClassName, classContent.replace("class PolyCustomFunction", "class " + customFunctionSpecificationClassName));
          generateFunctionTypeClasses(specification, customFunctionSpecification.getFunction(), currentPackage);
        }
        if (specification instanceof WebhookHandleSpecification webhookHandleSpecification) {
          var type = (FunctionPropertyType.class.cast(webhookHandleSpecification.getFunction().getArguments().get(0).getType()).getSpec().getArguments().get(0).getType());
          if (type instanceof ObjectPropertyType) {
            generateObjectPropertyType(currentPackage, (ObjectPropertyType) type, StringUtils.toPascalCase(specification.getName()) + "$EventType");
          }
        }
      }
      getFileService().createClassFile(node.isRoot() ? PACKAGE_NAME_BASE : currentPackage, className, template.apply(context));

      for (Map.Entry<String, LibraryTreeNode<Specification>> entry : node.getSubContexts().entrySet()) {
        var subContextPackage = node.isRoot() ? currentPackage : currentPackage + "." + entry.getKey().toLowerCase();
        generateClassesFromTree(entry.getValue(), subContextPackage);
      }
    } catch (IOException e) {
      // FIXME: Set custom exception.
      throw new RuntimeException(e);
    }
  }

  private void generateFunctionTypeClasses(Specification specification, FunctionSpecification functionSpecification, String packageName) {
    if (functionSpecification.getReturnType() instanceof ObjectPropertyType returnType) {
      generateObjectPropertyType(packageName, returnType, StringUtils.toPascalCase(specification.getName()) + "$ReturnType");
    }

    for (PropertySpecification argument : functionSpecification.getArguments()) {
      if (argument.getType() instanceof ObjectPropertyType argumentType) {
        generateObjectPropertyType(packageName, argumentType, StringUtils.toPascalCase(specification.getName()) + "$" + StringUtils.toPascalCase(argument.getName()));
      }
    }
  }
}
