package io.polyapi.client.error.generation;

/**
 * Exception thrown when trying to access the constructor of a generated class and it doesn't exist.
 */
public class MissingDefaultConstructorException extends GenerationException {

    public MissingDefaultConstructorException(String qualifiedName, Throwable cause) {
        super("Attempting to access default constructor for class {} and it is not accessible.", qualifiedName, cause);
    }
}
