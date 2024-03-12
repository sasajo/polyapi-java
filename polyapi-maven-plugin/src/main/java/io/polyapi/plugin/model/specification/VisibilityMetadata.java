package io.polyapi.plugin.model.specification;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class VisibilityMetadata {
    private Visibility visibility;
    private String foreignTenantName;
}

