package io.polyapi.plugin.service.template;

import com.github.jknack.handlebars.Helper;
import com.github.jknack.handlebars.Options;

import java.io.IOException;
import java.util.function.BiPredicate;

/**
 * {@link Helper} class that takes a {@link BiPredicate} and evaluates the parameters of the {@link Helper#apply(Object, Options)} method in it.
 * If true, the function result will be {@link Options#fn()}, otherwise {@link Options#inverse()}
 *
 * @param <T> The type of the Helper.
 * @see Helper
 */
public class ConditionHelper<T> implements Helper<T> {

  private final BiPredicate<T, Options> predicate;

  public ConditionHelper(BiPredicate<T, Options> predicate) {
    this.predicate = predicate;
  }

  @Override
  public Object apply(T value, Options options) throws IOException {
    return predicate.test(value, options) ? options.fn() : options.inverse();
  }
}
