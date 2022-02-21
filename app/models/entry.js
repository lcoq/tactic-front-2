import { set } from '@ember/object';
import Model, { attr, belongsTo } from '@ember-data/model';
import { computed } from '@ember/object';
import moment from 'moment';
import EntryStateManagerModel from './entry-state-manager';

export default class EntryModel extends Model {
  @attr('string') title;
  @attr('date') startedAt;
  @attr('date') stoppedAt;
  @belongsTo user;

  @computed('startedAt', 'stoppedAt')
  get durationInSeconds() {
    if (this.startedAt && this.stoppedAt) {
      return moment(this.stoppedAt).diff(this.startedAt, 'seconds');
    }
  }

  init() {
    super.init(...arguments);
    set(this, 'stateManager', new EntryStateManagerModel({ source: this }));
  }
}
