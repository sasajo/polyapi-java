package io.polyapi.plugin.service.schema;

import com.fasterxml.jackson.databind.JsonNode;
import com.sun.codemodel.JClassContainer;
import com.sun.codemodel.JType;
import lombok.extern.slf4j.Slf4j;
import org.jsonschema2pojo.Schema;
import org.jsonschema2pojo.rules.EnumRule;
import org.jsonschema2pojo.rules.RuleFactory;

import java.util.Spliterators;

import static java.util.Spliterator.ORDERED;
import static java.util.stream.StreamSupport.stream;

@Slf4j
public class PublicEnumRule extends EnumRule {

    protected PublicEnumRule(RuleFactory ruleFactory) {
        super(ruleFactory);
    }

    @Override
    public JType apply(String nodeName, JsonNode node, JsonNode parent, JClassContainer container, Schema schema) {
        return stream(Spliterators.<JType>spliteratorUnknownSize(container.getPackage().classes(), ORDERED), false)
                .filter(definedClass -> definedClass.name().equalsIgnoreCase(nodeName))
                .findFirst()
                .orElseGet(() -> super.apply(nodeName, node, parent, container.getPackage(), schema));
    }

    @Override
    protected String getConstantName(String nodeName, String customName) {
        return super.getConstantName(nodeName.replace("-", "_"), customName);
    }
}
