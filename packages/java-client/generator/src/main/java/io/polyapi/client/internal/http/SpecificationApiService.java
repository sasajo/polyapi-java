package io.polyapi.client.internal.http;

/**
 * Service dedicated to operations with Specifications on the Poly API webservice.
 */
public interface SpecificationApiService {

  /**
   * Retrieve all the JSON specifications in Poly.
   *
   * @param baseUrl     The base URL where the Poly API instance is.
   * @param bearerToken The authentication bearer token.
   * @return String A JSON containing the specifications.
   */
  String getJsonSpecs(String baseUrl, String bearerToken);
}
