package io.polyapi.plugin.service.schema;

import com.sun.codemodel.JCodeModel;
import io.polyapi.plugin.error.PolyApiMavenPluginException;
import io.polyapi.plugin.model.CustomType;
import io.polyapi.plugin.model.property.PropertyType;
import io.polyapi.plugin.service.PolyCodeWriter;
import io.polyapi.plugin.service.PolyGenerationConfig;
import org.jsonschema2pojo.GenerationConfig;
import org.jsonschema2pojo.Jackson2Annotator;
import org.jsonschema2pojo.SchemaGenerator;
import org.jsonschema2pojo.SchemaMapper;
import org.jsonschema2pojo.SchemaStore;
import org.jsonschema2pojo.rules.RuleFactory;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.util.List;
import java.util.Optional;

public class JsonSchemaParser {
    private static final Logger logger = LoggerFactory.getLogger(JsonSchemaParser.class);

    // FIXME: This whole JSon schema parsing needs:
    // FIXME: 1. More automated testing.
    // FIXME: 2. A refactor.
    public List<CustomType> parse(String defaultName, String packageName, PropertyType propertyType) {
        try {
            var codeModel = new JCodeModel();
            logger.trace("Generating Java code from JSon schema {}.", propertyType.getTypeSchema());

            // This cannot be put as an attribute of this class as it does not take well when being reused and has many errors.
            new SchemaMapper(new PolyRuleFactory(new PolyGenerationConfig()), new SchemaGenerator())
                    .generate(codeModel,
                            propertyType.getType(defaultName)
                                    .replace(List.class.getName(), "")
                                    .replace("<", "")
                                    .replace(">", ""),
                            packageName,
                            Optional.ofNullable(propertyType.getTypeSchema()).orElse(""));
            logger.debug("Code generated. Writing to string.");
            try (var codeWriter = new PolyCodeWriter()) {
                codeModel.build(codeWriter);
                var result = codeWriter.getClasses();
                if (logger.isTraceEnabled()) {
                    result.forEach((String name, String code) -> logger.trace("Generated code for {} is: {}", name, code));
                }
                return result.entrySet().stream()
                        .map(entry -> new CustomType(packageName, entry.getKey(), entry.getValue()))
                        .toList();
            }
        } catch (IOException e) {
            //FIXME: Throw the appropriate exception
            throw new PolyApiMavenPluginException(e);
        }
    }
}
