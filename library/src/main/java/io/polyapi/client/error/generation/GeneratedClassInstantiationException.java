package io.polyapi.client.error.generation;

/**
 * Exception thrown when an exception occurs while creating a generated class instance due to it not being correctly generated.
 */
public class GeneratedClassInstantiationException extends IncorrectlyGeneratedClassException {
    public GeneratedClassInstantiationException(String qualifiedName, Throwable cause) {
        super("An error ocurred while generating class '%s'.", qualifiedName, cause);
    }
}
