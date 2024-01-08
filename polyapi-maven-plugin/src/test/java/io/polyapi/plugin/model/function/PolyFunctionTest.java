package io.polyapi.plugin.model.function;


import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Optional;
import java.util.stream.Stream;

import static java.util.stream.Stream.empty;
import static org.hamcrest.CoreMatchers.equalTo;
import static org.hamcrest.MatcherAssert.assertThat;


public class PolyFunctionTest {
    private static final Logger logger = LoggerFactory.getLogger(PolyFunctionTest.class);
    private static final String DEFAULT_METHOD_NAME = "test";

    public static Stream<Arguments> getSignatureTestSource() throws Exception {
        return Stream.of(Arguments.of("Case 1: Generic name, no arguments.", DEFAULT_METHOD_NAME, empty(), "test()"),
                Arguments.of("Case 2: Generic name, single String argument.", DEFAULT_METHOD_NAME, Stream.of(String.class), "test(java.lang.String)"),
                Arguments.of("Case 3: Generic name, 2 String arguments.", DEFAULT_METHOD_NAME, Stream.of(String.class, String.class), "test(java.lang.String, java.lang.String)"),
                Arguments.of("Case 4: Generic name, single Integer argument.", DEFAULT_METHOD_NAME, Stream.of(Integer.class), "test(java.lang.Integer)"),
                Arguments.of("Case 5: Generic name, String and Integer argument.", DEFAULT_METHOD_NAME, Stream.of(String.class, Integer.class), "test(java.lang.String, java.lang.Integer)"),
                Arguments.of("Case 6: Generic name arguments.", DEFAULT_METHOD_NAME, null, "test()"),
                Arguments.of("Case 7: Null name, no arguments.", null, empty(), "null()"),
                Arguments.of("Case 8: Null name null arguments.", null, null, "null()"),
                Arguments.of("Case 9: Generic name, Null type arguments.", DEFAULT_METHOD_NAME, Stream.of(new Class[]{null}), "test(null)"),
                Arguments.of("Case 10: Generic name, String argument and Null type argument.", DEFAULT_METHOD_NAME, Stream.of(new Class[]{String.class, null}), "test(java.lang.String, null)"),
                Arguments.of("Case 11: Generic name, String argument, Null type argument and Integer argument in that order.", DEFAULT_METHOD_NAME, Stream.of(new Class[]{String.class, null, Integer.class}), "test(java.lang.String, null, java.lang.Integer)"));
    }

    @ParameterizedTest(name = "{0}")
    @MethodSource("getSignatureTestSource")
    public void getSignatureTest(String caseName, String name, Stream<Class<?>> argumentTypes, String expectedResult) {
        logger.debug("Executing test case - {}.", caseName);
        logger.debug("Expected result is {}.", expectedResult);
        var polyFunction = new PolyFunction();
        polyFunction.setName(name);
        polyFunction.setArguments(Optional.ofNullable(argumentTypes)
                .map(types -> types.map(type -> {
                    var argument = new PolyFunctionArgument();
                    argument.setType(Optional.ofNullable(type).map(Class::getName).orElse(null));
                    return argument;
                }))
                .map(Stream::toList)
                .orElse(null));
        var signature = polyFunction.getSignature();
        logger.debug("Result is {}.", signature);
        assertThat(signature, equalTo(expectedResult));
    }
}
