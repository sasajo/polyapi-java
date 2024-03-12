package io.polyapi.plugin.model.specification.resolved;

public class ResolvedStandardAuthFunctionSpecification extends ResolvedAuthFunctionSpecification {
    public ResolvedStandardAuthFunctionSpecification(ResolvedFunctionSpecification base) {
        super(base);
    }

    public Boolean getAudienceRequired() {
        return true; // FIXME: This needs to be set dynamically.
    }
}
