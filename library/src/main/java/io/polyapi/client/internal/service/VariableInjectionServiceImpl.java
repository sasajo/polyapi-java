package io.polyapi.client.internal.service;

import io.polyapi.client.api.InjectedVariable;
import io.polyapi.client.api.model.PolyEntity;
import io.polyapi.client.api.model.function.PolyFunction;
import io.polyapi.client.internal.model.PolyContext;
import io.polyapi.commons.api.error.PolyApiException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.lang.reflect.Field;
import java.util.List;
import java.util.function.Predicate;
import java.util.stream.Stream;

import static java.util.function.Predicate.not;
import static java.util.stream.Collectors.toList;

public class VariableInjectionServiceImpl implements VariableInjectionService {
    private static final Logger logger = LoggerFactory.getLogger(VariableInjectionServiceImpl.class);

    private final Class<?> vari;
    private List<ServerVariableKeyRecord> serverVariables;

    public VariableInjectionServiceImpl() {
        try {
            this.vari = Class.forName("io.polyapi.Vari");
        } catch (ClassNotFoundException e) {
            // Throw an appropriate exception.
            throw new RuntimeException(e);
        }
    }

    private synchronized List<ServerVariableKeyRecord> getServerVariables() {
        if (serverVariables == null) {
            serverVariables = scan(vari, vari);
        }
        return serverVariables;
    }

    private List<ServerVariableKeyRecord> scan(Class<?> contextClass, Object context) {
        List<ServerVariableKeyRecord> serverVariables = scan(contextClass, context, not(PolyContext.class::isInstance).and(not(PolyFunction.class::isInstance)))
                .peek(field -> field.setAccessible(true))
                .map(field -> {
                    try {
                        return new ServerVariableKeyRecord(field.get(context), field.getAnnotation(PolyEntity.class).value());
                    } catch (IllegalAccessException e) {
                        // FIXME: Throw the appropriate exception.
                        throw new PolyApiException(e);
                    }
                })
                .collect(toList()); // Using Stream.collect(toList()) instead of just Stream.toList() as the latter returns an unmodifiable list.
        scan(contextClass, context, PolyContext.class::isInstance)
                .map(field -> {
                    try {
                        return scan(field.getType(), field.get(context));
                    } catch (IllegalAccessException e) {
                        // FIXME: Throw the appropriate exception.
                        throw new PolyApiException(e);
                    }
                })
                .forEach(serverVariables::addAll);
        return serverVariables;
    }

    private Stream<Field> scan(Class<?> contextClass, Object context, Predicate<Object> filter) {
        return Stream.of(contextClass.getDeclaredFields())
                .peek(field -> field.setAccessible(true))
                .filter(field -> {
                    try {
                        return filter.test(field.get(context));
                    } catch (IllegalAccessException e) {
                        throw new RuntimeException(e);
                    }
                });
    }

    @Override
    public Object replace(String propertyName, Object original) {
        return getServerVariables().stream()
                .filter(record -> record.match(original))
                .peek(record -> logger.debug("Replacing property '{}' with variable with ID '{}'.", propertyName, record.id()))
                .findFirst()
                .<Object>map(record -> new InjectedVariable(record.id(), null))
                .orElse(original);
    }

    @Override
    public void put(Object key, Object value) {
        // Do nothing
    }
}
