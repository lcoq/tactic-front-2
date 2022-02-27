import Model, { attr, hasMany } from '@ember-data/model';

export default class ClientModel extends Model {
  @attr('string') name;
  @hasMany projects;
}
