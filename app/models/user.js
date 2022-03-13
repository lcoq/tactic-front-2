import Model, { attr, hasMany } from '@ember-data/model';

export default class UserModel extends Model {
  @attr('string') name;
  @attr('string') password;
  @hasMany('user-config') configs;
}
