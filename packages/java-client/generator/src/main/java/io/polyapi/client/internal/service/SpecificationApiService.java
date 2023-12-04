package io.polyapi.client.internal.service;

import io.polyapi.client.model.specification.Specification;

import java.util.List;

/**
 * Service dedicated to operations with Specifications on the Poly API webservice.
 */
public interface SpecificationApiService {

  /**
   * Retrieve all the JSON specifications in Poly.
   *
   * @return String A JSON containing the specifications.
   */
  List<Specification> getJsonSpecs();
}
