package io.polyapi.plugin.model.specification.function;

import io.polyapi.plugin.model.property.PropertyType;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class PropertyMetadata {
  private String name;
  private String description;
  private PropertyType type;
  private boolean required;
  private Boolean nullable;

  public String getInCodeName() {
    if (name == null || name.isEmpty()) {
      return name;
    }

    var camelCaseString = new StringBuilder();
    var firstChar = true;
    var nextCharUpperCase = false;
    var lowercaseCharsBefore = false;

    for (char ch : name.toCharArray()) {
      if (ch == ' ' || ch == '-' || ch == '_' || ch == '.') {
        nextCharUpperCase = true;
      } else {
        if (firstChar) {
          camelCaseString.append(Character.toLowerCase(ch));
          firstChar = false;
        } else {
          if (nextCharUpperCase) {
            camelCaseString.append(Character.toUpperCase(ch));
            nextCharUpperCase = false;
          } else {
            if (lowercaseCharsBefore && Character.isUpperCase(ch)) {
              camelCaseString.append(ch);
              lowercaseCharsBefore = false;
            } else {
              if (!lowercaseCharsBefore && Character.isLowerCase(ch)) {
                camelCaseString.append(ch);
                lowercaseCharsBefore = true;
              } else {
                camelCaseString.append(Character.toLowerCase(ch));
              }
            }
          }
        }
      }
    }
    return camelCaseString.toString();
  }
}
