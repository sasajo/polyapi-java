package io.polyapi.commons.api.model;

/**
 * Enum that indicates how will the strategy to update to the latest versions of a function be.
 */
public enum UpdateStrategy {
    /**
     * The function will update to the latest version whenever it is redeployed. This safe version is recommended for final deployment of functions.
     */
    MANUAL,
    /**
     * The function will update to the latest version whenever it is started. This unsafe version may fail suddenly if, for example, the server function is updated before being used and it changes the interface of the function.
     * The advantage of this approach is that it doesn't require a redeployment for non-backwards compatibility changes on the function.
     */
    AUTOMATIC,

    /**
     * The function will delegate the strategy of redeployment to the project. If no project property is set, it will default to AUTOMATIC.
     */
    PROJECT;
}
