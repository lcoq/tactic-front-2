import Model, { attr, belongsTo } from '@ember-data/model';

export default class SessionModel extends Model {
  @attr token;
  @attr name;
  @attr password;
  @belongsTo user;
}
