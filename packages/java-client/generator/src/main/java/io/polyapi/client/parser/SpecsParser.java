package io.polyapi.client.parser;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.polyapi.client.model.specification.Specification;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

public class SpecsParser {
  private final ObjectMapper objectMapper;

  public SpecsParser() {
    this.objectMapper = new ObjectMapper();
  }

  public List<Specification> parseSpecs(String jsonSpec) throws IOException {
    var reader = objectMapper.readerFor(Specification.class);
    var specifications = new ArrayList<Specification>();
    for (JsonNode node : objectMapper.readTree(jsonSpec)) {
      specifications.add(reader.readValue(node));
    }
    return specifications;
  }
}
