import { set } from '@ember/object';
import Model, { attr, hasMany } from '@ember-data/model';
import ClientStateManagerModel from './client-state-manager';

export default class ClientModel extends Model {
  @attr('string') name;
  @hasMany projects;

  stateManager = null;

  constructor() {
    super(...arguments);
    set(this, 'stateManager', new ClientStateManagerModel({ source: this }));
  }

  destroyRecord() {
    this.deleteRecord();
    return this.save().then(() => {
      this._unloadProjects();
      return this;
    });
  }

  _unloadProjects() {
    const projects = this.hasMany('projects').value() ?? [];
    projects.forEach((p) => p.unloadRecord());
    this.unloadRecord();
  }
}
