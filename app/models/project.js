import { set } from '@ember/object';
import Model, { attr, belongsTo } from '@ember-data/model';
import ProjectStateManagerModel from './project-state-manager';

export default class ProjectModel extends Model {
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
