package io.polyapi.plugin.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sun.codemodel.JCodeModel;
import com.sun.codemodel.JType;
import io.polyapi.plugin.error.PolyApiMavenPluginException;
import io.polyapi.plugin.model.generation.CustomType;
import io.polyapi.plugin.model.specification.function.ApiFunctionSpecification;
import io.polyapi.plugin.service.schema.JsonSchemaParser;
import io.polyapi.plugin.service.schema.PolyRuleFactory;
import org.apache.commons.io.IOUtils;
import org.jsonschema2pojo.SchemaGenerator;
import org.jsonschema2pojo.SchemaMapper;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;

import java.io.IOException;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.stream.Stream;

import static java.lang.String.format;
import static java.nio.charset.Charset.defaultCharset;
import static org.hamcrest.CoreMatchers.equalTo;
import static org.hamcrest.CoreMatchers.notNullValue;
import static org.hamcrest.MatcherAssert.assertThat;
import static org.junit.jupiter.api.Assertions.assertTrue;

public class JsonSchemaParserTest {
    private static final String DEFAULT_RESPONSE_NAME = "TestResponse";
    private final JsonSchemaParser jsonSchemaParser = new JsonSchemaParser();
    private final ObjectMapper objectMapper = new ObjectMapper();

    public static Stream<Arguments> generateSource() {
        return Stream.of(createArguments(1, "Simple recursive schema with no base type.", "Data", DEFAULT_RESPONSE_NAME),
                createArguments(2, "Recursive schema with base type.", "Coupon", "Discount", "Address", "CouponMetadata", "ResponseTypeMetadata", DEFAULT_RESPONSE_NAME, "InvoiceSettings", "Shipping"),
                createArguments(3, "Schema that has a text value evaluated to null.", "Message", DEFAULT_RESPONSE_NAME, "Edited", "Metadata", "Block", "Attachment", "Text", "EventPayload"),
                createArguments(4, "Schema with base type and no definitions.", DEFAULT_RESPONSE_NAME),
                createArguments(5, "Schema for array of numbers.", DEFAULT_RESPONSE_NAME),
                createArguments(6, "Schema for array of integers.", DEFAULT_RESPONSE_NAME),
                createArguments(7, "Simple schema with attribute.", DEFAULT_RESPONSE_NAME),
                createArguments(8, "Schema with duplicate fields.", "ResponseTypeElement"),
                createArguments(9, "Schema with enum.", "TestResponse", "DashStyle"),
                createArguments(10, "Schema that is a String."),
                createArguments(11, "Schema that uses allof."),
                createArguments(12, "Schema with enum with '-' in one of the options.", "Identifier", "TestResponse"),
                createArguments(13, "Schema with different types that have the same enum.", "Identifier", "TestResponse", "Data"));
    }

    private static Arguments createArguments(Integer caseNumber, String caseDescription, String... expectedNames) {
        return Arguments.of(caseDescription, format("Case %s", caseNumber), Arrays.stream(expectedNames).toList());
    }

    @ParameterizedTest(name = "{1}: {0}")
    @MethodSource("generateSource")
    public void generateTest(String description, String schemaFileName, List<String> expectedNames) throws IOException {
        var specification = new ApiFunctionSpecification();
        specification.setName("test");
        specification.setContext("polyapi.testing");
        var customTypes = jsonSchemaParser.parse("TestResponse", specification.getPackageName(), IOUtils.toString(JsonSchemaParser.class.getResourceAsStream(format("/%s/cases/%s.schema.json", JsonSchemaParser.class.getPackageName().replace(".", "/"), schemaFileName)), defaultCharset()));
        assertThat(customTypes, notNullValue());
        assertThat(customTypes.size(), equalTo(expectedNames.size()));
        var customTypeNames = customTypes.stream().map(CustomType::getName).toList();
        expectedNames.forEach(expectedName -> assertTrue(customTypeNames.contains(expectedName), format("Result should contain object with name %s. Result contains %s.", expectedName, customTypeNames)));
    }
}
