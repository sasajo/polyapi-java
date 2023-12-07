package io.polyapi.plugin.service;

import io.polyapi.commons.api.http.HttpClient;
import io.polyapi.commons.api.json.JsonParser;
import io.polyapi.plugin.model.specification.Specification;
import io.polyapi.commons.api.service.PolyApiService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.HashMap;
import java.util.List;

import static com.fasterxml.jackson.databind.type.TypeFactory.defaultInstance;
import static java.util.stream.Collectors.joining;

public class SpecificationApiServiceImpl extends PolyApiService implements SpecificationApiService {
  private static final Logger logger = LoggerFactory.getLogger(SpecificationApiServiceImpl.class);

  public SpecificationApiServiceImpl(String host, Integer port, HttpClient client, JsonParser jsonParser) {
    super(host, port, client, jsonParser);
  }

  @Override
  public List<Specification> getJsonSpecs() {
    logger.info("Retrieving JSon specifications from Poly API for this user.");
    List<Specification> specifications = get("specs", new HashMap<>(), new HashMap<>(), defaultInstance().constructCollectionType(List.class, Specification.class));
    logger.info("{} specifications retrieved.", specifications.size());
    if (logger.isDebugEnabled()) {
      logger.trace("Retrieved specifications the following IDs: [{}]", specifications.stream().map(Specification::getId).collect(joining(", ")));
    }
    return specifications;
  }
}
