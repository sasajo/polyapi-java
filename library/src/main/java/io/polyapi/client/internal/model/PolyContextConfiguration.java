package io.polyapi.client.internal.model;

import java.util.Optional;
import java.util.Properties;
import java.util.function.Function;

import static java.util.function.Function.identity;

public class PolyContextConfiguration {
  private static final Long DEFAULT_TIMEOUT_VALUES = 30000L;

  private final Properties properties;

  public PolyContextConfiguration(Properties properties) {
    this.properties = properties;
  }

  public String getHost() {
    return getProperty("io.polyapi.host");
  }

  public Integer getPort() {
    return getProperty("io.polyapi.port", Integer::valueOf, 443);
  }

  public String getApiKey() {
    return getProperty("io.polyapi.api.key");
  }

  public Long getConnectionTimeoutMillis() {
    return getProperty("io.polyapi.http.timeout.connection", Long::valueOf, DEFAULT_TIMEOUT_VALUES);
  }

  public Long getReadTimeoutMillis() {
    return getProperty("io.polyapi.http.timeout.read", Long::valueOf, DEFAULT_TIMEOUT_VALUES);
  }

  public Long getWriteTimeoutMillis() {
    return getProperty("io.polyapi.http.timeout.write", Long::valueOf, DEFAULT_TIMEOUT_VALUES);
  }

  public String getClientId() {
    return getProperty("io.polyapi.client.id");
  }

  private String getProperty(String key) {
    return this.getProperty(key, identity(), null);
  }

  private <T> T getProperty(String key, Function<String, T> conversionFunction, T defaultValue) {
    return Optional.ofNullable(properties.getProperty(key))
      .map(conversionFunction)
      .orElse(defaultValue);
  }
}
