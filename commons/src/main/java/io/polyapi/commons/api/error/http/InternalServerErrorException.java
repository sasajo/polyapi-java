package io.polyapi.commons.api.error.http;

import io.polyapi.commons.api.http.Response;
import org.apache.commons.io.IOUtils;

import java.io.IOException;
import java.io.InputStream;

/**
 * Exception thrown when there's an Internal Server Error (status code 500) response from the server.
 */
public class InternalServerErrorException extends HttpResponseException {

    /**
     * Constructor that takes a message and the response returned.
     *
     * @param response The response.
     */
    public InternalServerErrorException(Response response) {
            super(doIt(response.body()), response);
    }

    private static String doIt(InputStream body) {
        try {
            return IOUtils.toString(body);
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
    }
}
