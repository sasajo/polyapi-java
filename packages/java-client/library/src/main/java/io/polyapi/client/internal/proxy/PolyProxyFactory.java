package io.polyapi.client.internal.proxy;

import io.polyapi.client.internal.service.PolyFunctionLibraryService;
import io.polyapi.client.internal.service.PolyFunctionLibraryServiceImpl;
import io.polyapi.commons.api.error.PolyApiException;
import io.polyapi.commons.api.model.PolyEntity;
import io.polyapi.commons.api.model.PolyObject;

import java.io.IOException;
import java.lang.reflect.InvocationHandler;
import java.lang.reflect.Proxy;
import java.util.Optional;
import java.util.Properties;

import static java.lang.String.format;

public class PolyProxyFactory {
  private InvocationHandler serverFunctionInvocationHandler;

  /**
   * Utility constructor that retrieves the data from a configuration file.
   */
  public PolyProxyFactory() {
    this(Optional.of(new Properties()).map(properties -> {
      try {
        properties.load(PolyProxyFactory.class.getResourceAsStream("poly.properties"));
        return new PolyFunctionLibraryServiceImpl(properties.getProperty("polyapi.host"), Integer.valueOf(properties.getProperty("polyapi.port")), properties.getProperty("polyapi.apiKey"));
      } catch (IOException e) {
        // FIXME: Throw an appropriate exception.
        throw new PolyApiException("An error ocurred while retrieving the contents of 'poly.properties' file", e);
      }
    }).orElseThrow(PolyApiException::new)); // FIXME: Throw an appropriate exception.
  }

  public PolyProxyFactory(PolyFunctionLibraryService service) {
    this.serverFunctionInvocationHandler = new PolyInvocationHandler(service::invokeServerFunction);
  }

  /**
   * Creates a proxy for a determined {@link PolyObject} that uses the invocationHandler of this class. This method only
   * accepts interfaces. If something other is sent as an argument, a {@link PolyApiException} will be thrown.
   *
   * @param polyInterface The interface to proxy.
   * @param <T>           The type of the interface.
   * @return PolyObject A {@link Proxy} that implements of the expected interface.
   * @throws IllegalArgumentException Thrown when a class that is not an interface is set as argument.
   * @throws IllegalArgumentException Thrown when a class that is not an interface is set as argument.
   */
  public <T extends PolyObject> T createServerFunctionProxy(Class<T> polyInterface) {
    if (!polyInterface.isInterface()) {
      throw new IllegalArgumentException(format("Poly object defined is not an interface. Only interfaces are expected. Input class is '%s'", polyInterface.getName()));
    }
    if (polyInterface.getAnnotation(PolyEntity.class) == null) {
      throw new IllegalArgumentException(format("Poly object defined is not annotated by PolyEntity annotation. Input class is '%s'", polyInterface.getName()));
    }
    return polyInterface.cast(Proxy.newProxyInstance(polyInterface.getClassLoader(), new Class[]{polyInterface}, serverFunctionInvocationHandler));
  }
}
