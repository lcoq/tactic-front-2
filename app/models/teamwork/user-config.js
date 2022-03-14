import Model, { attr, belongsTo } from '@ember-data/model';

export default class TeamworkUserConfig extends Model {
  @belongsTo user;
  @attr name;
  @attr description;
  @attr value;
}
