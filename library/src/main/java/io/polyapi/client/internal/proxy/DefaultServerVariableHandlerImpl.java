package io.polyapi.client.internal.proxy;

import io.polyapi.client.api.model.variable.RetrievableServerVariableHandler;
import io.polyapi.client.internal.service.InvocationService;

import java.lang.reflect.Type;
import java.util.HashMap;
import java.util.Map;

public class DefaultServerVariableHandlerImpl<T> implements RetrievableServerVariableHandler<T> {
    private final InvocationService invocationService;
    private final String id;
    private final Type type;
    private final String packageName;
    private final String declaredType;

    public DefaultServerVariableHandlerImpl(String id, String packageName, Type type, String declaredType, InvocationService invocationService) {
        this.id = id;
        this.declaredType = declaredType;
        this.packageName = packageName;
        this.type = type;
        this.invocationService = invocationService;
    }

    @Override
    public T inject() {
        return invocationService.injectVariable(id, packageName, declaredType);
    }

    @Override
    public void update(T entity) {
        Map<String, T> body = new HashMap<>();
        body.put("value", entity);
        invocationService.updateVariable(id, body);
    }

    public T get() {
        return invocationService.getVariable(id, type);
    }
}
