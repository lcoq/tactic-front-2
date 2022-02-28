import EmberObject from '@ember/object';
import { resolve } from 'rsvp';

class NullClientStateManagerModel {
  once() {}
  off() {}
}

export default class NullClientModel extends EmberObject {
  id = '0';
  name = 'No client';
  isFrozen = true;
  stateManager = new NullClientStateManagerModel();
  projects = resolve();
}
