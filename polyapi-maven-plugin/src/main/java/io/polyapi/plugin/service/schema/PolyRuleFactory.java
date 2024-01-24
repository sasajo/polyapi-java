package io.polyapi.plugin.service.schema;

import com.sun.codemodel.JClassContainer;
import com.sun.codemodel.JType;
import org.jsonschema2pojo.GenerationConfig;
import org.jsonschema2pojo.Jackson2Annotator;
import org.jsonschema2pojo.SchemaStore;
import org.jsonschema2pojo.rules.Rule;
import org.jsonschema2pojo.rules.RuleFactory;
import org.jsonschema2pojo.util.NameHelper;

public class PolyRuleFactory extends RuleFactory {

    private NameHelper overwrittingNameHelper;

    public PolyRuleFactory(GenerationConfig config) {
        super(config, new Jackson2Annotator(config), new SchemaStore());
        this.overwrittingNameHelper = new JsonSchemaNameHelper(config);
    }

    @Override
    public void setGenerationConfig(GenerationConfig config) {
        super.setGenerationConfig(config);
        this.overwrittingNameHelper = new JsonSchemaNameHelper(config);
    }

    @Override
    public NameHelper getNameHelper() {
        return overwrittingNameHelper;
    }

    @Override
    public Rule<JClassContainer, JType> getEnumRule() {
        return new PublicEnumRule(this);
    }
}
