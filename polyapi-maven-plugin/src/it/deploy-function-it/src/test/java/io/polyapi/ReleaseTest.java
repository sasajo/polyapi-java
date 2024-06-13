package io.polyapi;

import org.junit.jupiter.api.Test;

import static org.hamcrest.CoreMatchers.equalTo;
import static org.hamcrest.MatcherAssert.assertThat;

public class ReleaseTest {

    @Test
    public void defaultFunctionTest() {
        assertThat(Poly.io.polyapi.it.defaultFunction("test"), equalTo("test - test"));
    }
}
