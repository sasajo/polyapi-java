package io.polyapi.client.internal.http;

import okhttp3.OkHttpClient;

public class PolyApiService {

  private OkHttpClient client;

  public PolyApiService(OkHttpClient client) {
    this.client = client;
  }

  public OkHttpClient getClient() {
    return client;
  }
}
