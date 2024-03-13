package io.polyapi.plugin.model.specification.resolved;

public class ResolvedStandardAuthFunctionSpecification extends ResolvedAuthFunctionSpecification {
    private final Boolean audienceRequired;

    public ResolvedStandardAuthFunctionSpecification(ResolvedFunctionSpecification base, Boolean audienceRequired) {
        super(base);
        this.audienceRequired = audienceRequired;
    }

    public Boolean getAudienceRequired() {
        return audienceRequired;
    }
}
