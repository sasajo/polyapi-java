package io.polyapi.client.internal.service;

import io.polyapi.client.error.http.UnexpectedHttpResponseException;
import io.polyapi.client.error.http.UnexpectedInformationalResponseException;
import io.polyapi.client.internal.http.HttpClient;
import io.polyapi.client.internal.http.HttpMethod;
import io.polyapi.client.internal.http.Request;
import io.polyapi.client.internal.http.Response;
import io.polyapi.client.internal.parse.JsonParser;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.InputStream;
import java.lang.reflect.Type;
import java.util.List;
import java.util.Map;

import static io.polyapi.client.internal.http.HttpMethod.GET;
import static io.polyapi.client.internal.http.HttpMethod.POST;
import static java.io.InputStream.nullInputStream;

/**
 * Parent implementation class for all services that connecto the Poly API service.
 */
public class PolyApiService {
  private static final Logger logger = LoggerFactory.getLogger(PolyApiService.class);

  private final String host;
  private final Integer port;
  private HttpClient client;
  private JsonParser jsonParser;

  public PolyApiService(String host, Integer port, HttpClient client, JsonParser jsonParser) {
    this.client = client;
    this.jsonParser = jsonParser;
    this.host = host;
    this.port = port;
  }

  public <O> O get(String relativePath, Map<String, List<String>> headers, Map<String, List<String>> queryParams, Type expectedResponseType) {
    return parsedCall(GET, relativePath, headers, queryParams, nullInputStream(), expectedResponseType);
  }

  public <I, O> O post(String relativePath, Map<String, List<String>> headers, Map<String, List<String>> queryParams, I body, Type expectedResponseType) {
    return parsedCall(POST, relativePath, headers, queryParams, body, expectedResponseType);
  }

  private <I, O> O parsedCall(HttpMethod method, String relativePath, Map<String, List<String>> headers, Map<String, List<String>> queryParams, I body, Type expectedResponseType) {
    Response response = callApi(method, relativePath, headers, queryParams, jsonParser.toJsonInputStream(body));
    if (response.statusCode() < 200) {
      throw new UnexpectedInformationalResponseException(response);
    }
    if (response.statusCode() >= 400) {
      // TODO: Change this to more specific exceptions per code. As some may require actions rather than displaying an error (i.e. token refresh).
      switch (response.statusCode()) {
        default:
          throw new UnexpectedHttpResponseException(response);
      }
    }
    logger.debug("Response is successful. Status code is {}.", response.statusCode());
    logger.debug("Parsing response.");
    O result = jsonParser.parseInputStream(response.body(), expectedResponseType);
    logger.debug("Response parsed successfully.");
    return result;
  }

  private Response callApi(HttpMethod method, String relativePath, Map<String, List<String>> headers, Map<String, List<String>> queryParams, InputStream body) {
    Request request = client.prepareAuthenticatedRequest(host, port, method, relativePath)
      .withHeaders(headers)
      .withQueryParams(queryParams)
      .withBody(body)
      .build();
    logger.debug("Executing authenticated GET request with target {}", request.getUrl());
    return client.send(request);
  }

  @Deprecated
  public HttpClient getClient() {
    return client;
  }
}
