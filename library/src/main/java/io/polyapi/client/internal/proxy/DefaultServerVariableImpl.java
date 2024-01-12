package io.polyapi.client.internal.proxy;

import io.polyapi.client.api.model.PolyEntity;
import io.polyapi.client.api.model.PolyProxy;
import io.polyapi.client.api.model.variable.RetrievableServerVariable;
import io.polyapi.client.internal.service.InvocationService;
import io.polyapi.client.internal.service.VariableInjectManager;

import java.lang.reflect.Type;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Stream;

import static java.lang.Boolean.FALSE;

public class DefaultServerVariableImpl<T> implements RetrievableServerVariable<T> {
    private static final Map<Class<?>, Object> DEFAULT_VALUES = Map.of(String.class, "", Integer.class, 0, Long.class, 0L, Double.class, 0D, Boolean.class, FALSE, Float.class, 0F);
    private final InvocationService invocationService;
    private final String id;
    private final Type type;
    private final String name;
    private final VariableInjectManager variableInjectManager;

    public DefaultServerVariableImpl(String id, String name, Type type, InvocationService invocationService, VariableInjectManager variableInjectManager) {
        this.id = id;
        this.type = type;
        this.name = name;
        this.invocationService = invocationService;
        this.variableInjectManager = variableInjectManager;
    }

    @Override
    public void update(T entity) {
        Map<String, T> body = new HashMap<>();
        body.put("value", entity);
        invocationService.updateVariable(id, body);
    }

    @Override
    public T inject(PolyProxy injectable, String... paramNames) {
        if (paramNames.length == 0) {
            return inject(injectable, name);
        } else {
            variableInjectManager.put(id, Optional.ofNullable(injectable).map(Object::getClass).map(Class::getInterfaces).map(Stream::of).orElseGet(Stream::of).map(parentInterface -> parentInterface.getAnnotation(PolyEntity.class)).map(PolyEntity::value).findFirst().orElse(null), paramNames);
            return (T) (DEFAULT_VALUES.containsKey(type) ? DEFAULT_VALUES.get(type) : null);
        }
    }

    public T get() {
        return invocationService.getVariable(id, type);
    }
}
