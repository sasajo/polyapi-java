package io.polyapi.plugin.service.generator;

import io.polyapi.commons.api.service.file.FileService;
import io.polyapi.plugin.model.LibraryTreeNode;
import io.polyapi.plugin.model.property.ObjectPropertyType;
import io.polyapi.plugin.model.specification.Specification;
import io.polyapi.plugin.model.specification.variable.ServerVariableSpecification;
import io.polyapi.plugin.utils.StringUtils;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Deprecated
public class VariContextClassGenerator extends SpecificationClassGenerator<ServerVariableSpecification> {

  private final LibraryTreeNode<ServerVariableSpecification> root = new LibraryTreeNode<>("Vari", true);

  public VariContextClassGenerator(FileService fileService) {
    super(fileService);
  }

  public void generate(List<Specification> specifications) {
    specifications.stream()
      .filter(ServerVariableSpecification.class::isInstance)
      .map(ServerVariableSpecification.class::cast)
      .forEach(this::insertIntoTree);

    generateClassesFromTree(root, PACKAGE_NAME_BASE + ".vari");
  }

  private void generateClassesFromTree(LibraryTreeNode<ServerVariableSpecification> node, String currentPackage) {
    var context = new HashMap<String, Object>();
    var className = StringUtils.toPascalCase(node.getContext());

    context.put("packageName", node.isRoot() ? PACKAGE_NAME_BASE : currentPackage);
    context.put("className", className);
    context.put("subContexts", node.getSubContexts().values().stream()
      .map(subContext -> {
        Map<String, Object> result = new HashMap<>();
        var subcontextClassName = StringUtils.toPascalCase(subContext.getContext());
        result.put("name", subContext.getContext());
        result.put("className", currentPackage + "." + subcontextClassName.toLowerCase() + "." + subcontextClassName);
        result.put("useStatic", node.isRoot());
        return result;
      })
      .toList());
    context.put("variables", node.getSpecifications());
    context.put("root", node.isRoot());

    var specifications = node.getSpecifications();
    for (var specification : specifications) {
      var type = specification.getVariable().getValueType();
      if (type instanceof ObjectPropertyType) {
        generateObjectPropertyType(currentPackage, ObjectPropertyType.class.cast(type), StringUtils.toPascalCase(specification.getName()) + "$VariableValue");
      }

      var specificationContext = new HashMap<String, Object>();
      specificationContext.put("className", specification.getClassName());
      specificationContext.put("packageName", currentPackage);
      specificationContext.put("specification", specification);
      specificationContext.put("typeName", specification.getVariable().getValueType().getInCodeType());
      getFileService().createClassFile(currentPackage, specification.getClassName(), "variableClass", specificationContext);
    }

    getFileService().createClassFile(node.isRoot() ? PACKAGE_NAME_BASE : currentPackage, className, "variContextClass", context);

    for (Map.Entry<String, LibraryTreeNode<ServerVariableSpecification>> entry : node.getSubContexts().entrySet()) {
      var subContextPackage = currentPackage + "." + entry.getKey().toLowerCase();
      generateClassesFromTree(entry.getValue(), subContextPackage);
    }
  }

  @Override
  public LibraryTreeNode<ServerVariableSpecification> getRoot() {
    return root;
  }
}

