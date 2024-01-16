package io.polyapi.plugin.service;

import io.polyapi.plugin.model.function.PolyFunction;

import java.io.File;
import java.util.List;

public interface JavaParserService {


    PolyFunction parseFunction(List<File> sourceRoots, List<String> jarPaths, File file, String functionName, String description, String context);
}
