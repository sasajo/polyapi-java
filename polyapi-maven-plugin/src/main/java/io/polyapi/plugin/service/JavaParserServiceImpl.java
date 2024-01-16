package io.polyapi.plugin.service;

import com.fasterxml.jackson.databind.JavaType;
import com.github.javaparser.JavaParser;
import com.github.javaparser.ParserConfiguration;
import com.github.javaparser.ast.Node;
import com.github.javaparser.ast.NodeList;
import com.github.javaparser.ast.body.MethodDeclaration;
import com.github.javaparser.ast.body.TypeDeclaration;
import com.github.javaparser.ast.expr.Expression;
import com.github.javaparser.ast.expr.MethodCallExpr;
import com.github.javaparser.ast.expr.NameExpr;
import com.github.javaparser.ast.stmt.BlockStmt;
import com.github.javaparser.ast.stmt.ReturnStmt;
import com.github.javaparser.resolution.declarations.ResolvedParameterDeclaration;
import com.github.javaparser.resolution.types.ResolvedType;
import com.github.javaparser.symbolsolver.JavaSymbolSolver;
import com.github.javaparser.symbolsolver.resolution.typesolvers.ClassLoaderTypeSolver;
import com.github.javaparser.symbolsolver.resolution.typesolvers.CombinedTypeSolver;
import com.github.javaparser.symbolsolver.resolution.typesolvers.JarTypeSolver;
import com.github.javaparser.symbolsolver.resolution.typesolvers.JavaParserTypeSolver;
import com.github.javaparser.symbolsolver.resolution.typesolvers.ReflectionTypeSolver;
import io.polyapi.commons.api.json.JsonParser;
import io.polyapi.plugin.error.PolyApiMavenPluginException;
import io.polyapi.plugin.error.classloader.QualifiedNameNotFoundException;
import io.polyapi.plugin.model.TypeData;
import io.polyapi.plugin.model.function.PolyFunction;
import io.polyapi.plugin.model.function.PolyFunctionArgument;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.File;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;

import static com.fasterxml.jackson.databind.type.TypeFactory.defaultInstance;
import static com.github.javaparser.ast.Modifier.Keyword.PUBLIC;
import static java.lang.Character.isUpperCase;
import static java.util.stream.IntStream.range;

public class JavaParserServiceImpl implements JavaParserService {
    private static final Logger logger = LoggerFactory.getLogger(JavaParserServiceImpl.class);
    private final JsonParser jsonParser;
    private final ClassLoader classLoader;

    public JavaParserServiceImpl(ClassLoader classLoader, JsonParser jsonParser) {
        this.classLoader = classLoader;
        this.jsonParser = jsonParser;
    }

    private TypeData parse(ResolvedType type) {
        logger.debug("Resolving type of method declaration.");
        TypeData result = new TypeData("void", null);
        if (!type.isVoid()) {
            logger.trace("Parsing loaded class to TypeData class.");
            result = new TypeData("object", jsonParser.toJsonSchema(toMap(type)));
        }
        logger.debug("Type resolved to {}.", result.name());
        return result;
    }

    private java.lang.reflect.Type toMap(ResolvedType type) {
        String qualifiedName = type.asReferenceType().getQualifiedName();
        String publicClassName = Arrays.stream(qualifiedName.split("\\."))
                .filter(keyword -> isUpperCase(keyword.toCharArray()[0]))
                .findFirst()
                .orElseThrow();// FIXME: Throw the appropriate exception.

        // Adding this way of defining the qualified name of a class because the library handles inner classes incorrectly, assigning them 'package.MainClass.InnerClass' when it should be 'package.MainClass$InnerClass'.
        String fixedQualifiedName = qualifiedName.substring(0, qualifiedName.indexOf(publicClassName)).concat(publicClassName).concat(qualifiedName.substring(qualifiedName.indexOf(publicClassName) + publicClassName.length()).replace(".", "$"));
        try {
            var typeFactory = defaultInstance();
            return typeFactory.constructParametricType(Class.forName(fixedQualifiedName, true, classLoader), type.asReferenceType().getTypeParametersMap().stream()
                    .map(pair -> pair.b)
                    .map(this::toMap)
                    .map(typeFactory::constructType)
                    .toArray(JavaType[]::new));
        } catch (ClassNotFoundException e) {
            throw new QualifiedNameNotFoundException(fixedQualifiedName, e);
        }
    }

    @Override
    public PolyFunction parseFunction(List<File> sourceRoots, List<String> jarPaths, File file, String functionName, String description, String context) {
        try {
            logger.debug("Setting up a combined type solvers.");
            var combinedTypeSolver = new CombinedTypeSolver();
            sourceRoots.stream()
                    .peek(sourceRoot -> logger.debug("    Adding JavaParserTypeSolver."))
                    .map(JavaParserTypeSolver::new)
                    .forEach(combinedTypeSolver::add);
            jarPaths.stream()
                    .peek(path -> logger.debug("    Adding JarTypeSolver."))
                    .map(path -> {
                        try {
                            return new JarTypeSolver(path);
                        } catch (IOException e) {
                            // FIXME Throw an appropriate exception.
                            throw new PolyApiMavenPluginException(e);
                        }
                    })
                    .forEach(combinedTypeSolver::add);
            logger.debug("    Adding ReflectionTypeSolver.");
            combinedTypeSolver.add(new ReflectionTypeSolver());
            logger.debug("    Adding ClassLoaderTypeSolver for classloader defined above.");
            combinedTypeSolver.add(new ClassLoaderTypeSolver(classLoader));
            logger.debug("CombinedTypeSolver complete.");
            logger.debug("Setting up Java Parser.");
            var parser = new JavaParser(new ParserConfiguration().setSymbolResolver(new JavaSymbolSolver(combinedTypeSolver)));
            logger.debug("Parser complete.");
            logger.info("Proceeding with parsing of file in path '{}'.", file.getAbsolutePath());
            var compilationUnit = parser.parse(file).getResult().orElseThrow();
            var functions = new ArrayList<PolyFunction>();
            compilationUnit.getTypes().stream()
                    .map(TypeDeclaration::resolve)
                    .forEach(resolvedCompilationUnit -> {
                        resolvedCompilationUnit.getDeclaredMethods().stream()
                                .filter(methodDeclaration -> methodDeclaration.getName().equals(functionName))
                                .peek(methodDeclaration -> logger.debug("Found matching method declaration: {}", methodDeclaration.getSignature()))
                                .forEach(methodDeclaration -> {
                                    logger.debug("Creating PolyFunction from method declaration: {}", methodDeclaration.getName());
                                    var function = new PolyFunction();
                                    function.setDescription(description);
                                    function.setContext(context);
                                    function.setArguments(new ArrayList<>());
                                    logger.trace("Parsing return type for {}.", methodDeclaration.getName());
                                    var typeData = parse(methodDeclaration.getReturnType());
                                    function.setName(methodDeclaration.getName());
                                    function.setReturnType(typeData.name());
                                    logger.trace("Adding JSon schema to return type.");
                                    function.setReturnTypeSchema(jsonParser.parseString(typeData.jsonSchema(), defaultInstance().constructMapType(HashMap.class, String.class, Object.class)));
                                    if (!methodDeclaration.getName().equals("execute")) {
                                        logger.debug("Adding execute() method for server to invoke.");
                                        MethodDeclaration executeMethod = compilationUnit.getType(0).asClassOrInterfaceDeclaration().addMethod("execute", PUBLIC)
                                                .setType(methodDeclaration.getReturnType().asReferenceType().getQualifiedName())
                                                .setBody(new BlockStmt(NodeList.nodeList(new ReturnStmt(new MethodCallExpr(methodDeclaration.getName(), range(0, methodDeclaration.getNumberOfParams()).boxed().map(methodDeclaration::getParam).map(ResolvedParameterDeclaration::getName).map(NameExpr::new).toArray(Expression[]::new))))));
                                        range(0, methodDeclaration.getNumberOfParams()).boxed().map(methodDeclaration::getParam)
                                                .forEach(param -> executeMethod.addParameter(param.asParameter().getType().asReferenceType().getQualifiedName().substring(param.asParameter().getType().asReferenceType().getQualifiedName().lastIndexOf('.') + 1), param.getName()));
                                    }
                                    logger.trace("Parsing parameters.");
                                    range(0, methodDeclaration.getNumberOfParams()).boxed().map(methodDeclaration::getParam)
                                            .peek(param -> logger.trace("    Parsing parameter {}.", param.getName()))
                                            .map(param -> {
                                                logger.debug("Adding parameter '{}' to execute method.", param.getName());
                                                logger.trace("Converting to PolyFunctionArgument.");
                                                var argument = new PolyFunctionArgument();
                                                argument.setName(param.getName());
                                                var argumentTypeData = parse(param.getType());
                                                argument.setType(param.getType().asReferenceType().getQualifiedName());
                                                argument.setTypeSchema(argumentTypeData.jsonSchema());
                                                return argument;
                                            })
                                            .forEach(function.getArguments()::add);
                                    logger.trace("Parsed {} parameters.", function.getArguments().size());
                                    compilationUnit.getPackageDeclaration().ifPresent(Node::remove);
                                    compilationUnit.getType(0).setName("PolyCustomFunction");
                                    function.setCode(compilationUnit.toString());
                                    functions.add(function);
                                });
                    });

            if (functions.isEmpty()) {
                throw new PolyApiMavenPluginException("No function with name " + functionName + " found in file: " + file.getAbsolutePath());
            } else if (functions.size() > 1) {
                throw new PolyApiMavenPluginException("More than one function with name " + functionName + " found in file: " + file.getAbsolutePath());
            }
            return functions.get(0);
        } catch (
                FileNotFoundException e) {
            throw new PolyApiMavenPluginException("Error parsing file", e);
        }

    }
}
