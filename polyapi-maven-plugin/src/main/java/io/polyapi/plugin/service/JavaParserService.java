package io.polyapi.plugin.service;

import com.github.javaparser.ast.type.Type;
import io.polyapi.plugin.model.TypeData;
import io.polyapi.plugin.model.function.PolyFunction;

import java.io.File;
import java.util.List;

public interface JavaParserService {

    /**
     * Extracts the data from a type to be able to process it in Poly API.
     *
     * @param type The type to process.
     * @return TypeData The parsed type.
     */
    TypeData parse(Type type);

    PolyFunction parseFunction(List<File> sourceRoots, List<String> jarPaths, File file, String functionName, String description, String context);
}
