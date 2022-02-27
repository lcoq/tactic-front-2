import Model, { attr, belongsTo } from '@ember-data/model';

export default class ProjectModel extends Model {
  @attr('string') name;
  @belongsTo client;
}
