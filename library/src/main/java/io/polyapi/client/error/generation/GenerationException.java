package io.polyapi.client.error.generation;

import io.polyapi.client.error.PolyApiLibraryException;
import io.polyapi.commons.api.error.PolyApiException;
import lombok.Getter;

import static java.lang.String.format;

@Getter
public class GenerationException extends PolyApiLibraryException {

    private final String qualifiedName;

    /**
     * Default constructor, accepts the message template as well as the qualified name of the class to be generated.
     */
    public GenerationException(String messageTemplate, String qualifiedName, Throwable cause) {
        super(format(messageTemplate, qualifiedName), cause);
        this.qualifiedName = qualifiedName;
    }

}
