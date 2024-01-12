package io.polyapi.client.internal.service;

import io.polyapi.client.api.InjectedVariable;

import java.util.HashMap;
import java.util.IdentityHashMap;
import java.util.Map;
import java.util.stream.Stream;

import static java.lang.ThreadLocal.withInitial;
import static java.util.Objects.hash;

public class VariableInjectManager {
    private static final ThreadLocal<VariableInjectManager> instance = withInitial(VariableInjectManager::new);

    private final Map<Integer, String> injectionMap = new HashMap<>();


    private VariableInjectManager() {
    }

    // FIXME: This should not be a singleton.
    public static VariableInjectManager getInstance() {
        return instance.get();
    }

    public Object getInjectedValueOrOriginal(String injectableId, String param, Object original) {
        var hash = hash(injectableId, param);
        return injectionMap.containsKey(hash) ? new InjectedVariable(injectionMap.remove(hash), null) : original;
    }

    public void put(String variableId, String injectableId, String... paramNames) {
        Stream.of(paramNames)
                .map(paramName -> hash(injectableId, paramName))
                .forEach(hash -> injectionMap.put(hash, variableId));
    }
}
