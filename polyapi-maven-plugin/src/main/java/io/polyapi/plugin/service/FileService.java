package io.polyapi.plugin.service;

import io.polyapi.plugin.model.generation.Generable;

import java.io.File;

public interface FileService {

    default void generateFile(Generable generable, boolean overwriteFiles) {
        generateFile(generable, generable.getClass().getSimpleName(), overwriteFiles);
    }

    default void generateFile(Generable generable, String template, boolean overwriteFiles) {
        createClassFile(generable.getPackageName(), generable.getClassName(), template, generable, overwriteFiles);
    }

    default void createClassFile(String classPackage, String className, String template, Object context, boolean overwriteFiles) {
        createFileFromTemplate(new File(new File("target/generated-sources/" + classPackage.replace('.', '/')), className + ".java"), template, context, overwriteFiles);
    }

    /**
     * Creates a file, its parent directory and adds contents to it.
     *
     * @param file           The {@link File} to write.
     * @param content        The contents of the file.
     * @param overwriteFiles Flag indicating if existing files should be overwritten.
     */
    void createFileWithContent(File file, String content, boolean overwriteFiles);

    /**
     * Creates a file, its parent directory and adds contents to it. The contents are created from a template and a context.
     *
     * @param file           The {@link File} to write.
     * @param template       The name of the template of the content of the file.
     * @param context        The context which, provided to the template, will form the content of the file.
     * @param overwriteFiles Flag indicating if existing files should be overwritten.
     */
    void createFileFromTemplate(File file, String template, Object context, boolean overwriteFiles);
}
