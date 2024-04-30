package io.polyapi.client.internal.proxy;

import io.polyapi.client.api.model.PolyEntity;
import io.polyapi.client.api.model.function.*;
import io.polyapi.client.api.model.variable.ServerVariableHandler;
import io.polyapi.client.api.model.websocket.PolyTrigger;
import io.polyapi.client.internal.proxy.invocation.handler.PolyInvocationHandler;
import io.polyapi.client.internal.proxy.invocation.handler.PolyTriggerInvocationHandler;
import io.polyapi.client.internal.proxy.invocation.handler.VariInvocationHandler;
import io.polyapi.client.internal.service.InvocationService;
import io.polyapi.commons.api.model.PolyObject;
import io.polyapi.commons.api.websocket.WebSocketClient;

import java.lang.reflect.InvocationHandler;
import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Proxy;
import java.util.ArrayList;

import static java.lang.String.format;
import static java.lang.reflect.Proxy.newProxyInstance;

public class PolyProxyFactory {
    private final InvocationHandler apiFunctionInvocationHandler;
    private final InvocationHandler serverFunctionInvocationHandler;
    private final InvocationHandler customFunctionInvocationHandler;
    private final InvocationHandler subresourceAuthFunctionInvocationHandler;
    private final InvocationHandler authFunctionInvocationHandler;
    private final InvocationHandler serverVariableInvocationHandler;
    private final PolyTriggerInvocationHandler polyTriggerInvocationHandler;

    public PolyProxyFactory(InvocationService invocationService, WebSocketClient webSocketClient) {
        this.serverFunctionInvocationHandler = new PolyInvocationHandler(invocationService::invokeServerFunction);
        this.apiFunctionInvocationHandler = new PolyInvocationHandler(invocationService::invokeApiFunction);
        this.customFunctionInvocationHandler = new PolyInvocationHandler(invocationService::invokeCustomFunction);
        this.authFunctionInvocationHandler = new PolyInvocationHandler(invocationService::invokeAuthFunction);
        this.subresourceAuthFunctionInvocationHandler = new PolyInvocationHandler(invocationService::invokeSubresourceAuthFunction);
        this.polyTriggerInvocationHandler = new PolyTriggerInvocationHandler(webSocketClient);
        this.serverVariableInvocationHandler = new VariInvocationHandler(invocationService);
    }

    /**
     * Creates a proxy for a determined {@link PolyObject} that uses the invocationHandler for server functions. This
     * method only accepts interfaces. If something other is sent as an argument, an {@link IllegalArgumentException} will be thrown.
     *
     * @param polyInterface The interface to proxy.
     * @param <T>           The type of the interface.
     * @return PolyObject A {@link Proxy} that implements of the expected interface.
     * @throws IllegalArgumentException Thrown when a class that is not an interface is set as argument.
     * @throws IllegalArgumentException Thrown when a class that is not an interface is set as argument.
     */
    public <T extends PolyServerFunction> T createServerFunctionProxy(Class<T> polyInterface) {
        return createProxy(serverFunctionInvocationHandler, polyInterface);
    }

    /**
     * Creates a proxy for a determined {@link PolyObject} that uses the invocationHandler for API functions. This
     * method only accepts interfaces. If something other is sent as an argument, an {@link IllegalArgumentException} will be thrown.
     *
     * @param polyInterface The interface to proxy.
     * @param <T>           The type of the interface.
     * @return PolyObject A {@link Proxy} that implements of the expected interface.
     * @throws IllegalArgumentException Thrown when a class that is not an interface is set as argument.
     * @throws IllegalArgumentException Thrown when a class that is not an interface is set as argument.
     */
    public <T extends PolyApiFunction> T createApiFunctionProxy(Class<T> polyInterface) {
        return createProxy(apiFunctionInvocationHandler, polyInterface);
    }

    @SuppressWarnings("unchecked")
    public <T> T createServerVariableProxy(String type, String packageName) {
        return (T) switch (type.toLowerCase()) {
            case "boolean" -> new Boolean(false);
            case "integer" -> new Integer(0);
            case "string", "object" -> new String();
            case "list" -> new ArrayList<>();
            case "double" -> new Double(0D);
            case "long" -> new Long(0L);
            case "short" -> new Short((short) 0);
            case "byte" -> new Byte((byte) 0);
            default -> {
                try {
                    yield Class.forName(format("%s.%s", packageName, type)).getConstructor().newInstance();
                } catch (InstantiationException e) {
                    // FIXME: Throw the appropriate exception.
                    throw new RuntimeException(e);
                } catch (IllegalAccessException e) {
                    // FIXME: Throw the appropriate exception.
                    throw new RuntimeException(e);
                } catch (InvocationTargetException e) {
                    // FIXME: Throw the appropriate exception.
                    throw new RuntimeException(e);
                } catch (NoSuchMethodException e) {
                    // FIXME: Throw the appropriate exception.
                    throw new RuntimeException(e);
                } catch (ClassNotFoundException e) {
                    // FIXME: Throw the appropriate exception.
                    throw new RuntimeException(e);
                }
            }

        };
    }

    public <T extends PolyCustomFunction> T createCustomVariableProxy(Class<T> polyInterface) {
        return createProxy(customFunctionInvocationHandler, polyInterface);
    }

    public <T extends TokenAuthFunction> T createTokenAuthProxy(Class<T> polyInterface) {
        return createProxy(authFunctionInvocationHandler, polyInterface);
    }

    public <T extends AudienceTokenAuthFunction> T createAudienceTokenAuthProxy(Class<T> polyInterface) {
        return createProxy(authFunctionInvocationHandler, polyInterface);
    }

    public <T extends SubresourceAuthFunction> T createSubresourceAuthProxy(Class<T> polyInterface) {
        return createProxy(subresourceAuthFunctionInvocationHandler, polyInterface);
    }

    public <T, H extends ServerVariableHandler<T>> H createServerVariableHandler(Class<H> polyInterface) {
        return createProxy(serverVariableInvocationHandler, polyInterface);
    }

    private <T extends PolyObject> T createProxy(InvocationHandler invocationHandler, Class<T> polyInterface) {
        if (!polyInterface.isInterface()) {
            throw new IllegalArgumentException(format("Poly object defined is not an interface. Only interfaces are expected. Input class is '%s'", polyInterface.getName()));
        }
        if (polyInterface.getAnnotation(PolyEntity.class) == null) {
            throw new IllegalArgumentException(format("Poly object defined is not annotated by PolyEntity annotation. Input class is '%s'", polyInterface.getName()));
        }
        return polyInterface.cast(newProxyInstance(polyInterface.getClassLoader(), new Class[]{polyInterface}, invocationHandler));
    }

    public <T extends PolyTrigger> T createPolyTrigger(Class<T> polyInterface) {
        return createProxy(polyTriggerInvocationHandler, polyInterface);
    }
}
