package io.polyapi.plugin.service;

import com.sun.codemodel.CodeWriter;
import com.sun.codemodel.JPackage;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.ByteArrayOutputStream;
import java.io.FilterOutputStream;
import java.io.IOException;
import java.io.OutputStream;
import java.util.HashMap;
import java.util.Map;

import static java.nio.charset.Charset.defaultCharset;
import static java.util.stream.Collectors.toMap;

@Slf4j
public class PolyCodeWriter extends CodeWriter implements AutoCloseable {
    private final Map<String, ByteArrayOutputStream> outputStreams = new HashMap<>();

    @Override
    public OutputStream openBinary(JPackage pkg, String fileName) throws IOException {
        log.debug("Opening binary on package {} for file {}", pkg.name(), fileName);
        var outputStream = new ByteArrayOutputStream();
        outputStreams.put(fileName.replace(".java", ""), outputStream);
        return new FilterOutputStream(outputStream) {
            public void close() {
                // don't let this stream close
            }
        };
    }

    public Map<String, String> getClasses() {
        return outputStreams.entrySet().stream()
                .collect(toMap(Map.Entry::getKey, entry -> entry.getValue().toString(defaultCharset())));
    }

    @Override
    public void close() throws IOException {
        for (OutputStream outputStream : outputStreams.values()) {
            outputStream.close();
        }
    }
}
