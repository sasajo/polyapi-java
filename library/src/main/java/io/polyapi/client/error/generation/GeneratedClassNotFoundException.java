package io.polyapi.client.error.generation;

/**
 * Exception thrown when a generated class is not loaded into the class loader.
 */
public class GeneratedClassNotFoundException extends GenerationException {

    public GeneratedClassNotFoundException(String qualifiedName, Throwable cause) {
        super("Class with qualified name '%s' not found.", qualifiedName, cause);
    }

}
