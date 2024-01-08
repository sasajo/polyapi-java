package io.polyapi.plugin.error.validation;

import java.io.File;
import java.util.Optional;

/**
 * {@link ValidationException} thrown when a file in a determined path doesn't exist.
 */
public class InexistentFileException extends ValidationException {

    private final File file;

    public InexistentFileException(String propertyName, File file) {
        super(propertyName, "File property '%s' with value '" + Optional.ofNullable(file).map(File::getAbsolutePath).orElse("null") + "' does not exist.");
        this.file = file;
    }

    public File getFile() {
        return file;
    }
}
