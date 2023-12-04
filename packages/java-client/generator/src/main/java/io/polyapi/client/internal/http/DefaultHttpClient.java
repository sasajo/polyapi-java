package io.polyapi.client.internal.http;

import io.polyapi.client.error.PolyApiClientException;
import okhttp3.OkHttpClient;
import okhttp3.RequestBody;
import org.apache.commons.io.IOUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.util.UUID;
import java.util.stream.Collectors;

import static java.lang.String.format;
import static java.nio.charset.Charset.defaultCharset;
import static java.util.stream.Collectors.joining;

public class DefaultHttpClient implements HttpClient {
  private static final Logger logger = LoggerFactory.getLogger(DefaultHttpClient.class);

  private final OkHttpClient client;

  private TokenProvider tokenProvider;

  public DefaultHttpClient(OkHttpClient client, TokenProvider tokenProvider) {
    this.client = client;
    this.tokenProvider = tokenProvider;
  }

  @Override
  public HttpRequestBuilder prepareRequest(String host, Integer port, HttpMethod method, String relativePath) {
    logger.debug("Preparing request ");
    return new HttpRequestBuilder(host, port, method, relativePath);
  }

  @Override
  public HttpRequestBuilder prepareAuthenticatedRequest(String host, Integer port, HttpMethod method, String relativePath) {
    return prepareRequest(host, port, method, relativePath)
      .withHeader("Authorization", tokenProvider.getTokenAsHeader());
  }

  @Override
  public Response send(Request request) {
    try {
      UUID requestId = UUID.randomUUID();
      logger.debug("Sending request. Request identified as {}.", requestId);
      if (logger.isTraceEnabled()) {

        // Adding logging trace values.
        logger.warn("Trace logging enabled. Request specific confidential information such as secret keys and tokens may be revealed.");
        logger.trace("Request with ID {} contents:\n{\n'url':'{}';\n'headers': {\n{}\n};\n'method': '{}';\n'body':{}",
          requestId,
          request.getUrl(),
          request.headers().entrySet().stream()
            .map(entry -> format("'%s'='%s'", entry.getKey(), entry.getValue().stream().collect(joining(", "))))
            .collect(joining(";")),
          IOUtils.toString(request.body(), defaultCharset())
        );
      }
      okhttp3.Request.Builder builder = new okhttp3.Request.Builder()
        .url(request.getUrl())
        .method(request.method().name(), RequestBody.create(IOUtils.toString(request.body(), defaultCharset()).getBytes(defaultCharset())));

      // This block of code is created because the Headers class doesn't have a way of including the headers all together.
      request.headers().entrySet().forEach(entry -> entry.getValue().forEach(value -> builder.header(entry.getKey(), value)));
      okhttp3.Response response = client.newCall(builder.build())
        .execute();
      logger.debug("Request with ID {} complete. Status code is {}", requestId, response.code());
      return new ResponseRecord(response.headers().toMultimap(), response.body().byteStream(), response.code());
    } catch (IOException e) {
      // FIXME: Throw the appropriate exception.
      throw new PolyApiClientException(e);
    }
  }
}
