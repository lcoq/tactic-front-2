import { tracked } from '@glimmer/tracking';
import EventEmitter from 'eventemitter3';

export default class StateManagerModel {
  source = null;
  states = null;

  @tracked currentState = null;

  constructor({ source }) {
    this.source = source;
    this.eventEmitter = new EventEmitter();
    this.states = this.stateClasses.map(
      (klass) => new klass({ manager: this, source })
    );
    this.currentState = this.states[0];
  }

  send() {
    this.currentState.send(...arguments);
  }

  transitionTo(stateName) {
    const newState = this.states.findBy('name', stateName);
    this.currentState.leave();
    newState.enter();
    this.currentState = newState;
  }

  on() {
    this.eventEmitter.on(...arguments);
  }

  once() {
    this.eventEmitter.once(...arguments);
  }

  off() {
    this.eventEmitter.off(...arguments);
  }
}
