package io.polyapi.client;

import io.polyapi.client.model.specification.Specification;
import io.polyapi.client.parser.SpecsParser;
import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.io.InputStream;
import java.util.List;

import static java.nio.charset.StandardCharsets.UTF_8;
import static org.junit.jupiter.api.Assertions.assertFalse;

public class SpecsParserTest {

  @Test
  public void testParseSpecs() throws IOException {
    try (InputStream is = getClass().getClassLoader().getResourceAsStream("specs.json")) {

      // Parse the spec and perform assertions
      List<Specification> specifications = new SpecsParser().parseSpecs(new String(is.readAllBytes(), UTF_8));

      // Perform your assertions here based on expected values
      // Example:
      assertFalse(specifications.isEmpty(), "Specifications should not be empty");
      // TODO: More assertions...
    }
  }
}
