package io.polyapi.plugin.service;

import io.polyapi.commons.api.http.HttpClient;
import io.polyapi.commons.api.json.JsonParser;
import io.polyapi.commons.api.service.PolyApiService;
import io.polyapi.plugin.model.specification.Specification;
import io.polyapi.plugin.model.specification.function.ServerFunctionSpecification;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import static com.fasterxml.jackson.databind.type.TypeFactory.defaultInstance;
import static java.lang.String.format;
import static java.util.function.Function.identity;
import static java.util.stream.Collectors.joining;

@Slf4j
public class SpecificationServiceImpl extends PolyApiService implements SpecificationService {

    public SpecificationServiceImpl(String host, Integer port, HttpClient client, JsonParser jsonParser) {
        super(host, port, client, jsonParser);
    }

    @Override
    public List<Specification> getJsonSpecs() {
        log.info("Retrieving JSon specifications from Poly API for this user.");
        List<Specification> specifications = get("specs", defaultInstance().constructCollectionType(List.class, Specification.class));
        log.info("{} specifications retrieved.", specifications.size());
        if (log.isDebugEnabled()) {
            log.trace("Retrieved specifications with the following IDs: [{}]", specifications.stream().map(Specification::getId).collect(joining(", ")));
        }
        log.debug("Validating for duplicate context/name pairs.");
        Map<String, Specification> uniquenessValidationMap = new HashMap<>();
        specifications.stream()
                .filter(specification -> !(specification instanceof ServerFunctionSpecification serverFunctionSpecification && !serverFunctionSpecification.getLanguage().equalsIgnoreCase("java")))
                .forEach(specification -> {
            String key = format("%s.%s", specification.getContext(), specification.getName()).toLowerCase();
            if (uniquenessValidationMap.containsKey(key)) {
                log.warn("Skipping {} specification '{}' in context '{}' as it clashes with {} specification with the same name and context.", specification.getType(), specification.getName(), specification.getContext(), uniquenessValidationMap.get(key).getType());
            } else {
                log.debug("Specification key '{}' not repeated (yet).", key);
                uniquenessValidationMap.put(key, specification);
            }
        });
        return uniquenessValidationMap.values().stream().toList();
    }
}
