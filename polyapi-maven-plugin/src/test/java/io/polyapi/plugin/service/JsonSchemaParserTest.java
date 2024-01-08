package io.polyapi.plugin.service;

import com.fasterxml.jackson.databind.node.JsonNodeFactory;
import com.fasterxml.jackson.databind.util.RawValue;
import io.polyapi.plugin.model.CustomType;
import io.polyapi.plugin.model.property.ObjectPropertyType;
import io.polyapi.plugin.model.specification.function.ApiFunctionSpecification;
import io.polyapi.plugin.model.specification.function.FunctionMetadata;
import org.apache.commons.io.IOUtils;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;

import java.io.IOException;
import java.util.List;
import java.util.stream.Stream;

import static java.lang.String.format;
import static java.nio.charset.Charset.defaultCharset;
import static org.hamcrest.CoreMatchers.equalTo;
import static org.hamcrest.CoreMatchers.notNullValue;
import static org.hamcrest.MatcherAssert.assertThat;
import static org.junit.jupiter.api.Assertions.assertTrue;

public class JsonSchemaParserTest {
    private final JsonSchemaParser jsonSchemaParser = new JsonSchemaParser();

    public static Stream<Arguments> generateReturnClassStructureSource() throws Exception {
        return Stream.of(Arguments.of("Simple recursive schema with no base type.", "Case 1", 2, List.of("Data", "TestResponse")),
                Arguments.of("Recursive schema with base type.", "Case 2", 8, List.of("Coupon", "Discount", "Address", "CouponMetadata", "ResponseTypeMetadata", "TestResponse", "InvoiceSettings", "Shipping")),
                Arguments.of("Schema that has a text value evaluated to null.", "Case 3", 8, List.of("Message", "TestResponse", "Edited", "Metadata", "Block", "Attachment", "Text", "EventPayload")),
                Arguments.of("Schema with base type and no definitions.", "Case 4", 1, List.of("TestResponse")));
    }

    @ParameterizedTest(name = "{1}: {0}")
    @MethodSource("generateReturnClassStructureSource")
    public void generateReturnClassStructureTest(String description, String schemaFileName, Integer expectedSize, List<String> expectedNames) throws IOException {
        var specification = new ApiFunctionSpecification();
        specification.setId("");
        specification.setName("Test");
        specification.setContext("polyapi.testing");
        var functionMetadata = new FunctionMetadata();
        var returnType = new ObjectPropertyType();
        returnType.setSchema(JsonNodeFactory.instance.rawValueNode(new RawValue(IOUtils.toString(JsonSchemaParser.class.getResourceAsStream(format("/%s/cases/%s.schema.json", JsonSchemaParser.class.getPackageName().replace(".", "/"), schemaFileName)), defaultCharset()))));
        functionMetadata.setReturnType(returnType);
        specification.setFunction(functionMetadata);
        var customTypes = jsonSchemaParser.generateReturnClassStructure(specification).stream().map(CustomType::getName).toList();
        assertThat(customTypes, notNullValue());
        assertThat(customTypes.size(), equalTo(expectedSize));
        expectedNames.forEach(expectedName -> assertTrue(customTypes.contains(expectedName), format("Result should contain object with name %s. Result contains %s.", expectedName, customTypes)));
    }
}
