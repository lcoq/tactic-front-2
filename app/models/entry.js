import { set } from '@ember/object';
import Model, { attr, belongsTo } from '@ember-data/model';
import { computed } from '@ember/object';
import moment from 'moment';
import EntryStateManagerModel from './entry-state-manager';
import { tracked } from '@glimmer/tracking';

export default class EntryModel extends Model {
  @attr('string') title;
  @attr('date') startedAt;
  @attr('date') stoppedAt;
  @belongsTo user;
  @belongsTo project;

  @computed('project')
  get initialProject() {
    return this.project;
  }
  set initialProject(value) {
    return value;
  }

  @computed('project', 'initialProject')
  get projectHasChanged() {
    return this.project !== this.initialProject;
  }

  @computed('startedAt', 'stoppedAt')
  get durationInSeconds() {
    if (this.startedAt && this.stoppedAt) {
      return moment(this.stoppedAt).diff(this.startedAt, 'seconds');
    }
  }

  rollbackProject() {
    set(this, 'project', this.initialProject);
  }

  init() {
    super.init(...arguments);
    set(this, 'stateManager', new EntryStateManagerModel({ source: this }));
  }
}
