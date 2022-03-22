import { set } from '@ember/object';
import { attr, belongsTo } from '@ember-data/model';
import ProjectStateManagerModel from './project-state-manager';

import BaseModel from './base-model';

export default class ProjectModel extends BaseModel {
  @attr('string') name;
  @belongsTo client;

  stateManager = null;

  constructor() {
    super(...arguments);
    set(this, 'stateManager', new ProjectStateManagerModel({ source: this }));
  }

  get clientId() {
    return this.belongsTo('client').id();
  }
}
