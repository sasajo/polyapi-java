package io.polyapi.commons.api.websocket;

/**
 * Handle interface that allows the control of the listeners.
 * At the moment it can only close it, but in the future we will add more functionality.
 */
public interface Handle extends AutoCloseable {

    @Override
    void close();
}
