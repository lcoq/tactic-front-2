import Model, { attr, belongsTo } from '@ember-data/model';

export default class TeamworkDomainModel extends Model {
  @attr name;
  @attr alias;
  @attr token;
  @belongsTo user;
}
