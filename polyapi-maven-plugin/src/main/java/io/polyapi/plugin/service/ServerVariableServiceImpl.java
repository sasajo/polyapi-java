package io.polyapi.plugin.service;

import io.polyapi.commons.api.http.HttpClient;
import io.polyapi.commons.api.json.JsonParser;
import io.polyapi.commons.api.service.PolyApiService;
import io.polyapi.plugin.model.ServerVariable;

public class ServerVariableServiceImpl extends PolyApiService implements ServerVariableService {

    public ServerVariableServiceImpl(HttpClient client, JsonParser jsonParser, String host, Integer port) {
        super(client, jsonParser, host, port);
    }

    @Override
    public ServerVariable create(String name, String description, Object value, boolean secret, String context) {
        ServerVariable serverVariable = new ServerVariable();
        serverVariable.setName(name);
        serverVariable.setDescription(description);
        serverVariable.setValue(value);
        serverVariable.setSecret(secret);
        serverVariable.setContext(context);
        return post("variables", serverVariable, ServerVariable.class);
    }
}
