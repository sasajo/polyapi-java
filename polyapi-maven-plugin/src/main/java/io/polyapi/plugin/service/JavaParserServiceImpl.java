package io.polyapi.plugin.service;

import com.fasterxml.jackson.databind.JavaType;
import com.github.javaparser.JavaParser;
import com.github.javaparser.ParserConfiguration;
import com.github.javaparser.ast.body.MethodDeclaration;
import com.github.javaparser.ast.type.Type;
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
import io.polyapi.plugin.utils.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.File;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Optional;

import static com.fasterxml.jackson.databind.type.TypeFactory.defaultInstance;
import static java.lang.String.format;

public class JavaParserServiceImpl implements JavaParserService {
    private static final Logger logger = LoggerFactory.getLogger(JavaParserServiceImpl.class);
    private final JsonParser jsonParser;
    private final ClassLoader classLoader;

    public JavaParserServiceImpl(ClassLoader classLoader, JsonParser jsonParser) {
        this.classLoader = classLoader;
        this.jsonParser = jsonParser;
    }

    @Override
    public TypeData parse(Type type) {
        logger.debug("Resolving type of method declaration.");
        TypeData result = new TypeData("void", null);
        if (!type.isVoidType()) {
            logger.trace("Parsing loaded class to TypeData class.");
            result = new TypeData("object", jsonParser.toJsonSchema(toMap(type.resolve())));
        }
        logger.debug("Type resolved to {}.", result.name());
        return result;
    }

    private java.lang.reflect.Type toMap(ResolvedType type) {
        try {
            var typeFactory = defaultInstance();
            return typeFactory.constructParametricType(Class.forName(type.asReferenceType().getQualifiedName()), type.asReferenceType().getTypeParametersMap().stream()
                    .map(pair -> pair.b)
                    .map(this::toMap)
                    .map(typeFactory::constructType)
                    .toArray(JavaType[]::new));
        } catch (ClassNotFoundException e) {
            throw new QualifiedNameNotFoundException(type.asReferenceType().getQualifiedName(), e);
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
            var compilationUnit = parser.parse(file).getResult().get();
            var functions = new ArrayList<PolyFunction>();
            compilationUnit.findAll(MethodDeclaration.class).stream()
                    .filter(methodDeclaration -> methodDeclaration.getNameAsString().equals(functionName))
                    .peek(methodDeclaration -> logger.debug("Found matching method declaration: {}", methodDeclaration.getDeclarationAsString()))
                    .forEach(methodDeclaration -> {
                        logger.debug("Creating PolyFunction from method declaration: {}", methodDeclaration.getNameAsString());
                        var function = new PolyFunction();
                        function.setDescription(description);
                        function.setContext(context);
                        function.setArguments(new ArrayList<>());
                        logger.trace("Parsing return type for {}.", methodDeclaration.getNameAsString());
                        var typeData = parse(methodDeclaration.getType());
                        function.setName(methodDeclaration.getNameAsString());
                        function.setReturnType(typeData.name());
                        logger.trace("Adding JSon schema to return type.");
                        function.setReturnTypeSchema(jsonParser.parseString(typeData.jsonSchema(), defaultInstance().constructMapType(HashMap.class, String.class, Object.class)));
                        logger.trace("Parsing parameters.");
                        Optional.<List<com.github.javaparser.ast.body.Parameter>>ofNullable(methodDeclaration.getParameters()).orElseGet(ArrayList::new).stream()
                                .peek(param -> logger.trace("    Parsing parameter {}.", param.getName()))
                                .map(param -> {
                                    logger.trace("Converting to PolyFunctionArgument.");
                                    var argument = new PolyFunctionArgument();
                                    argument.setName(param.getNameAsString());
                                    var argumentTypeData = parse(param.getType());
                                    argument.setType(argumentTypeData.name());
                                    argument.setTypeSchema(argumentTypeData.jsonSchema());
                                    return argument;
                                })
                                .forEach(function.getArguments()::add);
                        logger.trace("Parsed {} parameters.", function.getArguments().size());
                        compilationUnit.getPackageDeclaration().ifPresent(declaration -> declaration.setName(format("io.polyapi.function.custom.%s", context)));
                        compilationUnit.getType(0).setName(format("%sDelegate", StringUtils.toPascalCase(function.getName())));
                        function.setCode(compilationUnit.toString());
                        functions.add(function);
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
