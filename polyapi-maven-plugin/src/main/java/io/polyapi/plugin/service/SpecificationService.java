package io.polyapi.plugin.service;

import io.polyapi.plugin.model.specification.Specification;

import java.util.List;

/**
 * Service dedicated to operations with Specifications on the Poly API webservice.
 */
public interface SpecificationService {

  /**
   * Retrieve all the JSON specifications in Poly.
   *
   * @return String A JSON containing the specifications.
   */
  List<Specification> getJsonSpecs();
}
