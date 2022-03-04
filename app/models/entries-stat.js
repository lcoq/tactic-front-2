import Model, { attr } from '@ember-data/model';

export default class EntriesStatModel extends Model {
  @attr('date') date;
  @attr('number') duration;
}
