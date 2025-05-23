package io.polyapi.commons.api.service;

import io.polyapi.commons.api.error.parse.ParsingException;
import io.polyapi.commons.api.error.parse.UnsupportedContentTypeException;
import io.polyapi.commons.api.http.HttpClient;
import io.polyapi.commons.api.http.HttpMethod;
import io.polyapi.commons.api.http.Request;
import io.polyapi.commons.api.http.Response;
import io.polyapi.commons.api.json.JsonParser;
import lombok.extern.slf4j.Slf4j;
import java.io.BufferedInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.lang.reflect.Type;
import java.lang.reflect.TypeVariable;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static io.polyapi.commons.api.http.HttpMethod.*;
import static java.nio.charset.Charset.defaultCharset;
import static java.util.function.Predicate.not;

/**
 * Parent implementation class for all services that connect to the PolyAPI service.
 */
@Slf4j
public class PolyApiService {
    private final String host;
    private final Integer port;
    private final HttpClient client;
    private final JsonParser jsonParser;

    public PolyApiService(HttpClient client, JsonParser jsonParser, String host, Integer port) {
        this.client = client;
        this.jsonParser = jsonParser;
        this.host = host;
        this.port = port;
    }

    public <O> O get(String relativePath, Type expectedResponseType) {
        return get(relativePath, new HashMap<>(), new HashMap<>(), expectedResponseType);
    }

    public <O> O get(String relativePath,
                     Map<String, List<String>> headers,
                     Map<String, List<String>> queryParams,
                     Type expectedResponseType) {
        return parsedCall(GET, relativePath, headers, queryParams, null, expectedResponseType);
    }

    public <I, O> O post(String relativePath, I body, Type expectedResponseType) {
        return post(relativePath, new HashMap<>(), new HashMap<>(), body, expectedResponseType);
    }

    public <I, O> O post(String relativePath,
                         Map<String, List<String>> headers,
                         Map<String, List<String>> queryParams,
                         I body,
                         Type expectedResponseType) {
        return parsedCall(POST, relativePath, headers, queryParams, body, expectedResponseType);
    }

    public <I> void patch(String relativePath, I body) {
        parsedCall(PATCH, relativePath, new HashMap<>(), new HashMap<>(), body, Void.TYPE);
    }

    public <I> void patch(String relativePath,
                          Map<String, List<String>> headers,
                          Map<String, List<String>> queryParams,
                          I body) {
        parsedCall(PATCH, relativePath, headers, queryParams, body, Void.TYPE);
    }

    public void delete(String relativePath) {
        delete(relativePath, new HashMap<>(), new HashMap<>(), null);
    }

    public <I> void delete(String relativePath,
                           Map<String, List<String>> headers,
                           Map<String, List<String>> queryParams,
                           I body) {
        parsedCall(DELETE, relativePath, headers, queryParams, body, Void.TYPE);
    }

    private <I, O> O parsedCall(HttpMethod method,
                                String relativePath,
                                Map<String, List<String>> headers,
                                Map<String, List<String>> queryParams,
                                I body,
                                Type expectedResponseType) {

        Map<String, List<String>> allHeaders = new HashMap<>();
        allHeaders.put("Content-type", List.of("application/json"));
        headers.forEach((key, value) -> allHeaders.put(key, value.stream().toList()));

        Response response = callApi(
                method,
                relativePath,
                allHeaders,
                queryParams,
                jsonParser.toJsonInputStream(body)
        );

        log.debug("Response is successful. Status code is {}.", response.statusCode());
        log.debug("Parsing response.");

        final int PREVIEW = 1024;
        byte[] previewBuf = new byte[PREVIEW];
        int previewLen = 0;
        BufferedInputStream bodyStream = new BufferedInputStream(response.body());

        // mark & read first PREVIEW bytes for potential error logging
        bodyStream.mark(PREVIEW);
        try {
            previewLen = bodyStream.read(previewBuf);
        } catch (IOException ignored) {
        }
        try {
            bodyStream.reset();
        } catch (IOException ignored) {
        }

        try {
            O parsed = Optional.of(expectedResponseType)
                    .filter(not(Void.TYPE::equals))
                    .map(type -> {
                        String contentType = response.headers()
                                .get("Content-type")
                                .stream()
                                .findFirst()
                                .orElse("application/json");

                        if (contentType.startsWith("application/json")) {
                            return jsonParser.parseInputStream(
                                    bodyStream,
                                    TypeVariable.class.isAssignableFrom(type.getClass())
                                            ? Object.class
                                            : type
                            );
                        }

                        if (checkType(type, String.class) && contentType.startsWith("text/")) {
                            try {
                                @SuppressWarnings("unchecked")
                                O result = (O) new String(
                                        bodyStream.readAllBytes(),
                                        defaultCharset()
                                );
                                return result;
                            } catch (IOException ioe) {
                                throw new ParsingException("Could not read text response", ioe);
                            }
                        }

                        if (checkType(type, InputStream.class)) {
                            @SuppressWarnings("unchecked")
                            O result = (O) bodyStream;
                            return result;
                        }

                        throw new UnsupportedContentTypeException(contentType, type);
                    })
                    .orElse(null);

            log.debug("Response parsed successfully.");
            return parsed;

        } catch (RuntimeException ex) {
            String snippet = previewLen > 0
                    ? new String(previewBuf, 0, previewLen, defaultCharset())
                    : "<no data>";
            log.error("Failed to parse response from {} {} (first {} bytes):\n{}",
                    method, relativePath, previewLen, snippet);
            throw ex;
        }
    }

    private boolean checkType(Type type, Class<?> expectedClass) {
        return (type.getClass().isAssignableFrom(Class.class)
                && ((Class<?>) type).isAssignableFrom(expectedClass))
                || TypeVariable.class.isAssignableFrom(type.getClass());
    }

    private Response callApi(HttpMethod method,
                             String relativePath,
                             Map<String, List<String>> headers,
                             Map<String, List<String>> queryParams,
                             InputStream body) {

        Request request = client.prepareAuthenticatedRequest(host, port, method, relativePath)
                .withHeaders(headers)
                .withQueryParams(queryParams)
                .withBody(body)
                .build();

        log.debug("Executing authenticated {} request with target {}", method, request.getUrl());
        return client.send(request);
    }
}
