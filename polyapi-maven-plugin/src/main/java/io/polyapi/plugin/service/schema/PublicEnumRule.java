package io.polyapi.plugin.service.schema;

import com.fasterxml.jackson.databind.JsonNode;
import com.sun.codemodel.*;
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

import static org.jsonschema2pojo.rules.PrimitiveTypes.isPrimitive;

public class PublicEnumRule extends EnumRule {

    protected PublicEnumRule(RuleFactory ruleFactory) {
        super(ruleFactory);
    }

    @Override
    public JType apply(String nodeName, JsonNode node, JsonNode parent, JClassContainer container, Schema schema) {
        return super.apply(nodeName, node, parent, container.getPackage(), schema);
    }
}
