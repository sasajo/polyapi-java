package io.polyapi.plugin.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import io.polyapi.plugin.model.CustomType;
import io.polyapi.plugin.model.property.ObjectPropertyType;
import io.polyapi.plugin.model.specification.function.ApiFunctionSpecification;
import io.polyapi.plugin.service.schema.JsonSchemaParser;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.util.List;
import java.util.function.Predicate;
import java.util.stream.Stream;

import static java.lang.String.format;
import static java.util.stream.Collectors.joining;
import static org.hamcrest.CoreMatchers.equalTo;
import static org.hamcrest.CoreMatchers.notNullValue;
import static org.hamcrest.MatcherAssert.assertThat;
import static org.junit.jupiter.api.Assertions.assertTrue;

public class JsonSchemaParserTest {
    private static final String DEFAULT_RESPONSE_NAME = "TestResponse";
    private final JsonSchemaParser jsonSchemaParser = new JsonSchemaParser();
    private final ObjectMapper objectMapper = new ObjectMapper();

    public static Stream<Arguments> generateSource() {
        return Stream.of(Arguments.of("Simple recursive schema with no base type.", "Case 1", 2, List.of("Data", DEFAULT_RESPONSE_NAME)),
                Arguments.of("Recursive schema with base type.", "Case 2", 8, List.of("Coupon", "Discount", "Address", "CouponMetadata", "ResponseTypeMetadata", DEFAULT_RESPONSE_NAME, "InvoiceSettings", "Shipping")),
                Arguments.of("Schema that has a text value evaluated to null.", "Case 3", 8, List.of("Message", DEFAULT_RESPONSE_NAME, "Edited", "Metadata", "Block", "Attachment", "Text", "EventPayload")),
                Arguments.of("Schema with base type and no definitions.", "Case 4", 1, List.of(DEFAULT_RESPONSE_NAME)),
                Arguments.of("Schema for array of numbers.", "Case 5", 1, List.of(DEFAULT_RESPONSE_NAME)),
                Arguments.of("Schema for array of integers.", "Case 6", 1, List.of(DEFAULT_RESPONSE_NAME)),
                Arguments.of("Simple schema with attribute.", "Case 7", 1, List.of(DEFAULT_RESPONSE_NAME)),
                Arguments.of("Schema with duplicate fields.", "Case 8", 1, List.of("ResponseTypeElement")),
                Arguments.of("Schema with enum.", "Case 9", 2, List.of("TestResponse", "DashStyle")));
    }

    @ParameterizedTest(name = "{1}: {0}")
    @MethodSource("generateSource")
    public void generateTest(String description, String schemaFileName, Integer expectedSize, List<String> expectedNames) throws IOException {
        var specification = new ApiFunctionSpecification();
        specification.setName("test");
        specification.setContext("polyapi.testing");
        var returnType = new ObjectPropertyType();
        returnType.setSchema(objectMapper.readTree(JsonSchemaParser.class.getResourceAsStream(format("/%s/cases/%s.schema.json", JsonSchemaParser.class.getPackageName().replace(".", "/"), schemaFileName))));
        var customTypes = jsonSchemaParser.parse("TestResponse", specification.getPackageName(), returnType);
        assertThat(customTypes, notNullValue());
        assertThat(customTypes.size(), equalTo(expectedSize));
        var customTypeNames = customTypes.stream().map(CustomType::getName).toList();
        expectedNames.forEach(expectedName -> assertTrue(customTypeNames.contains(expectedName), format("Result should contain object with name %s. Result contains %s.", expectedName, customTypeNames)));
    }
}
