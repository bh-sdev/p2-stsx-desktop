/**
 * This is a Service Event Bus
 */
class ServiceEventBus {
  /**
   * This is an object with all subscribed events
   */
  #bus = {};

  /**
   * This is a method to subscribe on any event
   * @param event name of event
   * @param callback Function what will be calling after event trigger
   */
  $on(event, callback) {
    this.#bus[event] = callback;
  }

  /**
   * This is a method to trigger event what was subscribed on
   * @param event name of event
   * @param rest it's a params what will be set for subscribed event and returned to the callback
   */
  $emit(event, ...rest) {
    if (this.#bus[event]) {
      this.#bus[event](...rest);
    } else {
      console.warn(`Event ${event} is not listening by EventBusService.$on("${event}", () => {}))`);
    }
  }

  /**
   * This is a method to trigger event what was subscribed on
   * @param event name of event
   * @param rest it's a params what will be set for subscribed event and returned to the callback
   */
  has(event) {
    return !!this.#bus[event];
  }

  /**
   * This is a method to clear events, can be cleared all if @param event will be null
   * @param event name of event
   */
  clear(event) {
    !event ? (this.#bus = {}) : delete this.#bus[event];
    return this;
  }
}

const INSTANCE = new ServiceEventBus();

export default INSTANCE;
