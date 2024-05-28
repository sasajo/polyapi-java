package io.polyapi.plugin.service;

import io.polyapi.commons.api.http.HttpClient;
import io.polyapi.commons.api.json.JsonParser;
import io.polyapi.commons.api.service.PolyApiService;
import io.polyapi.plugin.model.function.PolyFunction;
import lombok.extern.slf4j.Slf4j;

import static java.lang.String.format;

@Slf4j
public class PolyFunctionServiceImpl extends PolyApiService implements PolyFunctionService {

    public PolyFunctionServiceImpl(HttpClient client, JsonParser jsonParser, String host, Integer port) {
        super(client, jsonParser, host, port);
    }

    @Override
    public PolyFunction deploy(String type, PolyFunction polyFunction) {
        log.info("Deploying {} function '{}' on context '{}'.", type, polyFunction.getName(), polyFunction.getContext());
        PolyFunction function = post(format("functions/%s", type), polyFunction, PolyFunction.class);
        log.info("Deployment of {} function '{}' on context'{}' successful.", type, polyFunction.getName(), polyFunction.getContext());
        return function;
    }
}
