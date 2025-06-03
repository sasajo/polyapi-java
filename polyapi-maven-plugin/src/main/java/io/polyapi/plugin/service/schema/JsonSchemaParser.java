package io.polyapi.plugin.service.schema;

import com.sun.codemodel.JClass;
import com.sun.codemodel.JCodeModel;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.JsonNodeFactory;
import com.fasterxml.jackson.databind.node.ObjectNode;
import io.polyapi.plugin.error.PolyApiMavenPluginException;
import io.polyapi.plugin.model.ParsedType;
import io.polyapi.plugin.model.generation.CustomType;
import io.polyapi.plugin.service.PolyCodeWriter;
import io.polyapi.plugin.service.PolyGenerationConfig;
import lombok.extern.slf4j.Slf4j;
import org.jsonschema2pojo.SchemaGenerator;
import org.jsonschema2pojo.SchemaMapper;

import java.io.IOException;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.Iterator;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Slf4j
public class JsonSchemaParser {

    public List<CustomType> parse(String defaultName, String packageName, String schema) {
        try {
            ObjectMapper om = new ObjectMapper();
            JsonNode root = om.readTree(Optional.ofNullable(schema).orElse(""));

            int dupCount = patchDuplicates(root);
            if (dupCount > 0) {
                log.warn("⚠️ [{}] injected {} duplicate-field suffix(es)", defaultName, dupCount);
            }

            String patched = om.writeValueAsString(root);

            // generate Java code from the patched schema
            JCodeModel codeModel = new JCodeModel();
            new SchemaMapper(new PolyRuleFactory(new PolyGenerationConfig()), new SchemaGenerator())
                    .generate(codeModel, defaultName, packageName, patched);

            log.debug("Code generated. Writing to string.");
            try (var codeWriter = new PolyCodeWriter()) {
                codeModel.build(codeWriter);
                var result = codeWriter.getClasses();
                if (log.isTraceEnabled()) {
                    result.forEach((name, code) -> log.trace("Generated code for {} is: {}", name, code));
                }
                return result.entrySet().stream()
                        .map(entry -> new CustomType(packageName, entry.getKey(), entry.getValue()))
                        .collect(Collectors.toList());
            }
        } catch (IOException e) {
            throw new PolyApiMavenPluginException(e);
        }
    }

    public ParsedType getType(String defaultName, String packageName, String schema) {
        try {
            ObjectMapper om = new ObjectMapper();
            JsonNode root = om.readTree(Optional.ofNullable(schema).orElse(""));
            patchDuplicates(root);
            String patched = om.writeValueAsString(root);

            JClass jClass = new SchemaMapper(new PolyRuleFactory(new PolyGenerationConfig()), new SchemaGenerator())
                    .generate(new JCodeModel(), defaultName, packageName, patched)
                    .boxify();
            return getType(jClass);
        } catch (IOException e) {
            throw new PolyApiMavenPluginException(e);
        }
    }

    private ParsedType getType(JClass jClass) {
        return new ParsedType(
                jClass.erasure().fullName(),
                Optional.ofNullable(jClass.getTypeParameters()).orElseGet(ArrayList::new).stream()
                        .map(this::getType)
                        .collect(Collectors.toList())
        );
    }

    /**
     * Recursively mutates the JSON schema tree, injecting any properties whose
     * JSON names collapse to the same Java identifier under a suffix,
     * into both "properties" and "required".
     */
    private int patchDuplicates(JsonNode root) {
        if (!root.isObject()) return 0;
        int injectedCount = 0;
        ObjectNode obj = (ObjectNode) root;

        if (obj.has("properties")) {
            ObjectNode props = (ObjectNode) obj.get("properties");
            ArrayNode reqs   = obj.has("required")
                ? (ArrayNode) obj.get("required")
                : new ArrayNode(JsonNodeFactory.instance);

            Set<String> seen = new HashSet<>();
            List<String> collisions = new ArrayList<>();
            Iterator<String> it = props.fieldNames();
            while (it.hasNext()) {
                String jsonName = it.next();
                String normalized = jsonName.replaceAll("[^A-Za-z0-9]+","")
                                            .toLowerCase(Locale.ROOT);
                log.trace("  – jsonName='{}' → normalized='{}'", jsonName, normalized);
                if (!seen.add(normalized)) {
                    collisions.add(jsonName);
                }
            }

            int suffix = 1;
            for (String dup : collisions) {
                injectedCount++;
                String injected = dup + "_" + suffix++;
                JsonNode originalNode = props.get(dup);
                props.remove(dup);

                // re-insert under the suffixed name
                props.set(injected, originalNode);

                // now fix up "required": swap dup -> injected
                if (obj.has("required")) {
                    ArrayNode reqsArray = (ArrayNode) obj.get("required");
                    for (int i = 0; i < reqsArray.size(); i++) {
                        if (reqsArray.get(i).asText().equals(dup)) {
                            reqsArray.set(i, JsonNodeFactory.instance.textNode(injected));
                        }
                    }
                }
            }
        }

        Iterator<String> fieldsIt = obj.fieldNames();
        while (fieldsIt.hasNext()) {
            patchDuplicates(obj.get(fieldsIt.next()));
        }

        return injectedCount;
    }
}
