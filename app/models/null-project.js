import EmberObject from '@ember/object';
import { resolve } from 'rsvp';

class NullProjectStateManagerModel {
  once() {}
  off() {}
}

export default class NullProjectModel extends EmberObject {
  id = '0';
  name = 'No project';
  clientId = '0';
  stateManager = new NullProjectStateManagerModel();
  projects = resolve();
}
