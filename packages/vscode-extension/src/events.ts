import EventEmitter from 'events';

enum Events {
  polySpecsChanged = 'poly-data-changed',
}

const eventEmitter = new EventEmitter();

export const registerPolySpecsChangedListener = (listener: (contextData: Record<string, any>) => any) => {
  eventEmitter.on(Events.polySpecsChanged, listener);

  return () => eventEmitter.off(Events.polySpecsChanged, listener);
};

export const polySpecsChanged = (functions: Record<string, any>) => eventEmitter.emit(Events.polySpecsChanged, functions);
