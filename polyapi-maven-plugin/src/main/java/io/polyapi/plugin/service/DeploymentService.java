package io.polyapi.plugin.service;

import io.polyapi.plugin.model.function.PolyFunction;

import java.util.List;

public interface DeploymentService {

    List<PolyFunction> deployFunctions(List<String> functions, boolean dryRun);
}
