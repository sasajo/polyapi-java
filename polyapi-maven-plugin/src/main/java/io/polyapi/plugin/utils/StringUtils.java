package io.polyapi.plugin.utils;

import org.apache.commons.text.WordUtils;

public class StringUtils {
  private static final char[] DELIMITERS = new char[]{' ', '_', '-', '.'};

  public static String toPascalCase(String input) {
    return WordUtils.capitalize(input, DELIMITERS).replaceAll("_|-|\\.|\\s", "");
  }
}
