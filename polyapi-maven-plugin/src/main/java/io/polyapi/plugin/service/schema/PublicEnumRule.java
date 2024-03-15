package io.polyapi.plugin.service.schema;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.sun.codemodel.*;
import org.json.JSONObject;
import org.jsonschema2pojo.GenerationConfig;
import org.jsonschema2pojo.Jackson2Annotator;
import org.jsonschema2pojo.Schema;
import org.jsonschema2pojo.SchemaStore;
import org.jsonschema2pojo.exception.ClassAlreadyExistsException;
import org.jsonschema2pojo.exception.GenerationException;
import org.jsonschema2pojo.model.EnumDefinition;
import org.jsonschema2pojo.rules.EnumRule;
import org.jsonschema2pojo.rules.RuleFactory;
import org.jsonschema2pojo.util.NameHelper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Optional;
import java.util.Spliterator;
import java.util.Spliterators;
import java.util.stream.Stream;
import java.util.stream.StreamSupport;

import static java.util.Spliterator.ORDERED;
import static java.util.Spliterators.spliteratorUnknownSize;
import static java.util.stream.StreamSupport.stream;
import static org.jsonschema2pojo.rules.PrimitiveTypes.isPrimitive;

public class PublicEnumRule extends EnumRule {
    private static final Logger logger = LoggerFactory.getLogger(PublicEnumRule.class);

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
