package io.polyapi.plugin.service;

import io.polyapi.plugin.model.specification.Specification;

import java.util.List;

/**
 * Service dedicated to operations with Specifications on the PolyAPI webservice.
 */
public interface SpecificationService {

    /**
     * Retrieve all the JSON specifications in Poly.
     *
     * @param context The contexts that should be used to filter the specifications.
     * @return String A JSON containing the specifications.
     */
    List<Specification> list(List<String> context);
}
