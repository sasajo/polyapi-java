package io.polyapi.plugin.model.specification.resolved;

import lombok.Getter;

import java.util.Set;

@Getter
public class ResolvedWebhookHandleSpecification extends ResolvedSpecification {
    private final String eventType;

    public ResolvedWebhookHandleSpecification(ResolvedSpecification base, String eventType) {
        super(base);
        this.eventType = eventType;
    }

    public ResolvedWebhookHandleSpecification(String id, String name, String packageName, Set<String> imports, String className, String eventType) {
        super(id, name, packageName, imports, className);
        this.eventType = eventType;
    }
}
