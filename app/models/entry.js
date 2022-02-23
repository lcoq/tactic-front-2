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

  @computed('startedAt', 'stoppedAt')
  get isStarted() {
    return this.startedAt && !this.stoppedAt;
  }

  start() {
    if (!this.isStarted) {
      this.startedAt = new Date();
    }
  }

  stop() {
    this.stoppedAt = new Date();
  }

  updateToDate(newDate) {
    const momentNewDate = moment(newDate);
    const initialStartedAt = moment(this.startedAt);
    const initialStoppedAt = moment(this.stoppedAt);
    const newStartedAt = moment(initialStartedAt)
      .year(momentNewDate.year())
      .dayOfYear(momentNewDate.dayOfYear());
    const newStoppedAt = moment(initialStoppedAt)
      .year(momentNewDate.year())
      .dayOfYear(momentNewDate.dayOfYear());
    if (newStartedAt.isAfter(newStoppedAt)) {
      newStoppedAt.add(1, 'day');
    }
    set(this, 'startedAt', newStartedAt.toDate());
    set(this, 'stoppedAt', newStoppedAt.toDate());
  }

  rollbackProject() {
    set(this, 'project', this.initialProject);
  }

  init() {
    super.init(...arguments);
    set(this, 'stateManager', new EntryStateManagerModel({ source: this }));
  }
}
