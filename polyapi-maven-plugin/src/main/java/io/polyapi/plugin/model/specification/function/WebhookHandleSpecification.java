package io.polyapi.plugin.model.specification.function;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class WebhookHandleSpecification extends FunctionSpecification {

    @Override
    protected String getSubtypePackage() {
        return "webhook";
    }
}
