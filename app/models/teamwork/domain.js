import { set } from '@ember/object';
import Model, { attr, belongsTo } from '@ember-data/model';
import TeamworkDomainStateManagerModel from './domain-state-manager';

export default class TeamworkDomainModel extends Model {
  @attr name;
  @attr alias;
  @attr token;
  @belongsTo user;

  stateManager = null;

  constructor() {
    super(...arguments);
    set(
      this,
      'stateManager',
      new TeamworkDomainStateManagerModel({ source: this })
    );
  }
}
