import { set } from '@ember/object';
import Model, { attr, belongsTo } from '@ember-data/model';
import moment from 'moment';
import EntryStateManagerModel from './entry-state-manager';
import { dependentKeyCompat } from '@ember/object/compat';
import { createCache, getValue } from '@glimmer/tracking/primitives/cache';
import { tracked } from '@glimmer/tracking';

export default class EntryModel extends Model {
  @attr('string') title;
  @attr('date') startedAt;
  @attr('date') stoppedAt;
  @belongsTo user;
  @belongsTo project;

  @tracked initialProject = null;

  get projectHasChanged() {
    return this.project !== this.initialProject;
  }

  get durationInSeconds() {
    return getValue(this._durationInSecondsCache);
  }

  @dependentKeyCompat
  get isStarted() {
    return this.startedAt && !this.stoppedAt;
  }

  @dependentKeyCompat
  get isStopped() {
    return !this.isStarted;
  }

  save() {
    return super.save(...arguments).then(() => {
      this.initialProject = null;
      return this;
    });
  }

  start() {
    if (!this.isStarted) {
      set(this, 'startedAt', new Date());
    }
  }

  stop() {
    set(this, 'stoppedAt', new Date());
  }

  async setProject(newProject) {
    if (!this.initialProject) {
      this.project.then((project) => (this.initialProject = project));
    }
    this.project = newProject;
  }

  rollbackProject() {
    set(this, 'project', this.initialProject);
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

  constructor() {
    super(...arguments);
    set(this, 'stateManager', new EntryStateManagerModel({ source: this }));
  }

  _durationInSecondsCache = createCache(() => {
    if (this.startedAt && this.stoppedAt) {
      return moment(this.stoppedAt).diff(this.startedAt, 'seconds');
    } else {
      return null;
    }
  });
}
