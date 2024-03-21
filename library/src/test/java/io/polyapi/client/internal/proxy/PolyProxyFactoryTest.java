package io.polyapi.client.internal.proxy;

import io.polyapi.client.api.model.PolyEntity;
import io.polyapi.client.internal.service.InvocationService;
import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.Test;
import org.powermock.api.mockito.PowerMockito;

import java.util.Map;

import static org.hamcrest.CoreMatchers.equalTo;
import static org.hamcrest.CoreMatchers.instanceOf;
import static org.hamcrest.MatcherAssert.assertThat;
import static org.mockito.ArgumentMatchers.anyMap;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@Slf4j
public class PolyProxyFactoryTest {
    private static final String DEFAULT_STRING = "DEFAULT_STRING";

    @Test
    public void createProxyTest() throws Throwable {
        String entityId = MockPolyServerFunction.class.getAnnotation(PolyEntity.class).value();
        log.debug("Mock object ID: {}", entityId);
        log.debug("Mocking InvocationHandler.");
        var serviceMock = PowerMockito.mock(InvocationService.class);
        when(serviceMock.invokeServerFunction(eq(MockPolyServerFunction.class), eq(entityId), anyMap(), eq(String.class))).thenReturn(DEFAULT_STRING);
        log.debug("Creating PolyProxyFactory with mock.");
        var factory = new PolyProxyFactory(serviceMock, null);
        log.debug("Creating proxy for {}.", MockPolyServerFunction.class.getSimpleName());
        var proxy = factory.createServerFunctionProxy(MockPolyServerFunction.class);
        log.debug("Proxy created.");
        assertThat(proxy, instanceOf(MockPolyServerFunction.class));
        assertThat(proxy.doMagic(DEFAULT_STRING), equalTo(DEFAULT_STRING));
        verify(serviceMock).invokeServerFunction(eq(MockPolyServerFunction.class), eq(entityId), eq(Map.of("parameter", DEFAULT_STRING)), eq(String.class));
    }
}
