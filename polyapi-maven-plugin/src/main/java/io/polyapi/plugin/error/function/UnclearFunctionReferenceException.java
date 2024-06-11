package io.polyapi.plugin.error.function;

import io.polyapi.plugin.error.PolyApiMavenPluginException;

import java.util.List;

import static java.lang.String.format;
import static java.lang.String.join;

public class UnclearFunctionReferenceException extends PolyApiMavenPluginException {

    public UnclearFunctionReferenceException(String expectedReference, List<String> retrievedReferences) {
        super(format("Unclear function reference. Expected '%s', but found '%s'. Please retry with a specific case sensitive one.", expectedReference, join(", ", retrievedReferences)));
    }
}
