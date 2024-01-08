package io.polyapi.plugin.model;

import java.util.List;

public record TypeNode(Class<?> type, List<TypeNode> children) {
}
