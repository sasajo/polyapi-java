import EventEmitter from 'events';

enum Events {
  polyDataChanged = 'poly-data-changed',
}

const eventEmitter = new EventEmitter();

export const registerPolyDataChangedListener = (listener: (contextData: Record<string, any>) => any) => {
  eventEmitter.on(Events.polyDataChanged, listener);

  return () => eventEmitter.off(Events.polyDataChanged, listener);
};

export const polyDataChanged = (functions: Record<string, any>) => eventEmitter.emit(Events.polyDataChanged, functions);
