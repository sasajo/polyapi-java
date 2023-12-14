package io.polyapi.plugin.model;

import io.polyapi.plugin.model.specification.Specification;
import lombok.Getter;
import lombok.Setter;

import java.util.HashSet;
import java.util.Set;
import java.util.TreeMap;

@Getter
@Setter
public class LibraryTreeNode<T extends Specification> {
  private final String context;
  private final boolean root;
  private final TreeMap<String, LibraryTreeNode<T>> subContexts = new TreeMap<>();
  private final Set<T> specifications = new HashSet<>();

  public LibraryTreeNode(String context, boolean root) {
    this.context = context;
    this.root = root;
  }

  public LibraryTreeNode(String context) {
    this.context = context;
    this.root = false;
  }

  public LibraryTreeNode<T> getOrPutNew(String context) {
    subContexts.putIfAbsent(context, new LibraryTreeNode<>(context));
    return subContexts.get(context);
  }

  public LibraryTreeNode<T> getSubContext(String context) {
    return subContexts.get(context);
  }

  public void addSpecification(T spec) {
    specifications.add(spec);
  }
}
