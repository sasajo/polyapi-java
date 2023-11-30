package io.polyapi.client.internal.http;

import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.Response;

import java.io.IOException;

public class SpecificationApiServiceImpl extends PolyApiService implements SpecificationApiService {

  public SpecificationApiServiceImpl(OkHttpClient client) {
    super(client);
  }

  @Override
  public String getJsonSpecs(String baseUrl, String bearerToken) {
    try (Response response = getClient().newCall(new Request.Builder()
      .url(baseUrl + "/specs")
      .header("Authorization", "Bearer " + bearerToken)
      .build()).execute()) {
      if (!response.isSuccessful()) {

        // FIXME: This should be a specific exception.
        throw new RuntimeException("Error while setting Poly specifications: " + response.code() + " " + response.message());
      }
      return response.body().string();

    } catch (IOException e) {
      throw new RuntimeException(e);
    }
  }
}
