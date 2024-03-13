package io.polyapi.plugin.model.generation;

import io.polyapi.plugin.model.specification.resolved.*;
import lombok.Getter;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.Set;

@Getter
public class ResolvedContext implements Generable {
    private final String name;
    private final String packageName;
    private final Set<String> imports;
    private final String className;
    private final List<ResolvedContext> subcontexts;
    private final List<ResolvedSpecification> specifications;

    public ResolvedContext(String name, String packageName, Set<String> imports, String className, List<ResolvedContext> subcontexts, List<ResolvedSpecification> specifications) {
        this.packageName = packageName;
        this.imports = imports;
        this.name = name;
        this.className = className;
        this.subcontexts = new ArrayList<>();
        Optional.ofNullable(subcontexts).ifPresent(this.subcontexts::addAll);
        this.specifications = new ArrayList<>();
        Optional.ofNullable(specifications).ifPresent(this.specifications::addAll);
    }

    public List<ResolvedServerFunctionSpecification> getServerFunctionSpecifications() {
        return filterSpecifications(ResolvedServerFunctionSpecification.class);
    }

    public List<ResolvedCustomFunctionSpecification> getCustomFunctionSpecifications() {
        return filterSpecifications(ResolvedCustomFunctionSpecification.class);
    }

    public List<ResolvedApiFunctionSpecification> getApiFunctionSpecifications() {
        return filterSpecifications(ResolvedApiFunctionSpecification.class);
    }

    public List<ResolvedAuthFunctionSpecification> getAuthFunctionSpecification() {
        return filterSpecifications(ResolvedAuthFunctionSpecification.class);
    }

    public List<ResolvedSubresourceAuthFunctionSpecification> getSubresourceAuthFunctionSpecifications() {
        return filterSpecifications(ResolvedSubresourceAuthFunctionSpecification.class);
    }

    public List<ResolvedStandardAuthFunctionSpecification> getStandardAuthFunctionSpecifications() {
        return filterSpecifications(ResolvedStandardAuthFunctionSpecification.class);
    }

    public List<ResolvedServerVariableSpecification> getServerVariableSpecifications() {
        return filterSpecifications(ResolvedServerVariableSpecification.class);
    }

    public List<ResolvedWebhookHandleSpecification> getWebhookHandlerSpecifications() {
        return filterSpecifications(ResolvedWebhookHandleSpecification.class);
    }

    public List<ResolvedDefaultFunctionSpecification> getFunctionSpecifications() {
        return filterSpecifications(ResolvedDefaultFunctionSpecification.class);
    }

    private <T extends ResolvedSpecification> List<T> filterSpecifications(Class<T> resolvedSpecificationClass) {
        return specifications.stream().filter(resolvedSpecificationClass::isInstance).map(resolvedSpecificationClass::cast).toList();
    }
}
