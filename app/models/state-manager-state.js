export default class StateManagerStateModel {
  source = null;
  manager = null;
  name = null;

  constructor({ manager, source }) {
    this.manager = manager;
    this.source = source;
  }

  enter() {}

  leave() {}

  send(actionName) {
    const action = this.actions[actionName];
    if (!action) {
      throw new Error(
        `Action '${actionName}' not found on state '${this.name}'`
      );
    }
    return action.call(this);
  }

  emit(eventName) {
    this.manager.eventEmitter.emit(eventName);
  }

  sendToCurrentState(actionName) {
    return this.manager.send(actionName);
  }

  transitionTo(stateName) {
    this.manager.transitionTo(stateName);
  }
}
