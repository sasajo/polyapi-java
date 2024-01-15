package io.polyapi.client.internal.service;

import io.polyapi.client.api.InjectedVariable;
import io.polyapi.commons.api.error.PolyApiException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.lang.reflect.InvocationTargetException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Map;

import static java.lang.String.format;

public class VariableInjectionServiceImpl implements VariableInjectionService {
    private static final Logger logger = LoggerFactory.getLogger(VariableInjectionServiceImpl.class);

    private static final Map<String, Object> injectionMap = new HashMap<>();

    @Override
    public Object replace(String propertyName, Object original) {
        return injectionMap.entrySet().stream()
                .filter(entry -> entry.getValue() == original)
                .peek(entry -> logger.debug("Replacing property '{}' with server variable with ID '{}'.", propertyName, entry.getKey()))
                .findFirst()
                .<Object>map(entry -> new InjectedVariable(entry.getKey(), null))
                .orElse(original);
    }

    public synchronized <T> T inject(String key, String packageName, String type) {
        logger.debug("Injecting variable with key '{}' and type '{}'.", key, type);
        if (!injectionMap.containsKey(key)) {
            logger.debug("Injection map doesn't contain the key, generating a new one.");
            injectionMap.put(key, switch (type.toLowerCase()) {
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
                        String className = format("%s.%s", packageName, type);
                        logger.debug("Type is not basic, generating new default instance with default constructor for class {}.", className);
                        yield Class.forName(className).getConstructor().newInstance();
                    } catch (InstantiationException e) {
                        // FIXME: Throw the appropriate exception.
                        throw new PolyApiException(e);
                    } catch (IllegalAccessException e) {
                        // FIXME: Throw the appropriate exception.
                        throw new PolyApiException(e);
                    } catch (InvocationTargetException e) {
                        // FIXME: Throw the appropriate exception.
                        throw new PolyApiException(e);
                    } catch (NoSuchMethodException e) {
                        // FIXME: Throw the appropriate exception.
                        throw new PolyApiException(e);
                    } catch (ClassNotFoundException e) {
                        // FIXME: Throw the appropriate exception.
                        throw new PolyApiException(e);
                    }
                }
            });
        }
        return (T) injectionMap.get(key);
    }
}
