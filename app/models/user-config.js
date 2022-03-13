import Model, { attr, belongsTo } from '@ember-data/model';

export default class UserConfig extends Model {
  @belongsTo user;
  @attr type;
  @attr name;
  @attr description;
  @attr value;
}
