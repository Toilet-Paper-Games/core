export class EventEmitter<T> {
  private listeners: ((payload: T) => void)[] = [];

  addListener(callback: (payload: T) => void) {
    this.listeners.push(callback);
    return {
      destroy: () => {
        this.listeners = this.listeners.filter((cb) => cb !== callback);
      },
    };
  }

  emit(payload: T) {
    this.listeners.forEach((callback) => callback(payload));
  }
}
