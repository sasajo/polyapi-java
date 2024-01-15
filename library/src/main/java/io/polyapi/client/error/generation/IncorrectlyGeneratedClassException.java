package io.polyapi.client.error.generation;

/**
 * Parent class of exceptions that come from incorrectly generated classes.
 */
public class IncorrectlyGeneratedClassException extends GenerationException {

    /**
     * @see GenerationException#GenerationException(String, String, Throwable)
     */
    public IncorrectlyGeneratedClassException(String message, String qualifiedName, Throwable cause) {
        super(message, qualifiedName, cause);
    }
}
