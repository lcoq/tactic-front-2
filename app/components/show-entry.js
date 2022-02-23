import Component from '@glimmer/component';
import { reads, and, or } from '@ember/object/computed';
import { action, computed } from '@ember/object';
import { tracked } from '@glimmer/tracking';
import moment from 'moment';
import parseHour from '../utils/parse-hour';
import parseDuration from '../utils/parse-duration';
import formatDuration from '../utils/format-duration';

export default class ShowEntryComponent extends Component {
  @tracked fieldNameToFocusOnEdit = null;
  @tracked rounding = false;

  @reads('args.entry') entry;
  @reads('args.searchProjects') searchProjects;

  @reads('entry.stateManager.isClear') isClear;
  @reads('entry.stateManager.isEditing') isEditing;
  @reads('entry.stateManager.isPendingDelete') isPendingDelete;
  @reads('entry.stateManager.isPendingSave') isPendingSave;
  @reads('entry.stateManager.isErrored') isErrored;
  @reads('entry.stateManager.isSaveErrored') isSaveErrored;
  @reads('entry.stateManager.isDeleteErrored') isDeleteErrored;
  @or('isPendingSave', 'isPendingDelete') canRevert;
  @and('restartEntry', 'entry.isClear') canRestartEntry;

  @computed(
    'isEditing',
    'isPendingDelete',
    'isPendingSave',
    'isSaveErrored',
    'isDeleteErrored',
    'rounding'
  )
  get classNames() {
    const names = [];
    if (this.isEditing) names.push('editing');
    if (this.isPendingDelete) names.push('deleting');
    if (this.isPendingSave) names.push('pending');
    if (this.isSaveErrored) names.push('errored');
    if (this.isDeleteErrored) names.push('errored');
    if (this.rounding) names.push('disabled');
    return names.join(' ');
  }

  @tracked formattedDuration = null;
  @tracked formattedStartedAt = null;
  @tracked formattedStoppedAt = null;

  @action formattedDurationChanged() {
    const duration = parseDuration(this.formattedDuration);
    if (duration !== null && duration !== this.entry.durationInSeconds) {
      const newStoppedAt = moment(this.entry.startedAt)
        .add(duration, 's')
        .toDate();
      this.entry.stoppedAt = newStoppedAt;
      this.formattedStoppedAt = moment(this.entry.stoppedAt).format('H:mm');
    }
  }

  @action editEntry(field) {
    if (!this.entry.stateManager.isEditing) {
      this._openEdit(field);
    }
  }

  @action closeEdit() {
    if (this.entry.stateManager.isEditing) {
      this._closeEdit();
    }
  }

  @action retrySaveOrDeleteEntry() {
    this.entry.stateManager.send('retry');
  }

  @action revertEditEntry() {
    this.args.didRevertEntry?.(this.entry);
    this.entry.stateManager.send('clear');
  }

  @action markEntryForDelete() {
    this.args.willDeleteEntry?.(this.entry);
    this.entry.stateManager.send('markForDelete');
  }

  @action changeEntryDate() {
    // TODO
  }

  @action selectProject(project) {
    this.entry.project = project;
    this._closeEdit();
  }

  @action restartEntry() {
    this.args.restartEntry?.(this.entry);
  }

  constructor() {
    super(...arguments);
    this.entry.stateManager.once('didDelete', this._didDeleteEntry, this);
    this.entry.stateManager.once('didSave', this._didUpdateEntry, this);
  }

  willDestroy() {
    super.willDestroy(...arguments);
    this.entry.stateManager.off('didDelete', this._didDeleteEntry, this);
    this.entry.stateManager.off('didSave', this._didUpdateEntry, this);
  }

  _openEdit(field) {
    this._setFormattedStartedAndStoppedAt();
    this.fieldNameToFocusOnEdit = field;
    this.entry.stateManager.send('edit');
  }

  _closeEdit() {
    if (this.isEditing) {
      this._updateStartedAndStoppedAt();
      this._clearFormattedStartedAndStoppedAt();
      if (this.args.willUpdateEntry) {
        this.args.willUpdateEntry(this.entry);
      }
      this.entry.stateManager.send('markForSave');
    }
  }

  _didUpdateEntry() {
    this.args.didUpdateEntry?.(this.entry);
    this.entry.stateManager.once('didSave', this._didUpdateEntry, this);
  }

  _didDeleteEntry() {
    this.args.didDeleteEntry?.(this.entry);
  }

  _setFormattedStartedAndStoppedAt() {
    this.formattedDuration = formatDuration(this.entry.durationInSeconds);
    this.formattedStartedAt = moment(this.entry.startedAt).format('H:mm');
    this.formattedStoppedAt = moment(this.entry.stoppedAt).format('H:mm');
  }

  _updateStartedAndStoppedAt() {
    const [newStartedAtHours, newStartedAtMinutes] = parseHour(
      this.formattedStartedAt
    );
    const newStartedAt = moment(this.entry.startedAt)
      .hours(newStartedAtHours)
      .minutes(newStartedAtMinutes)
      .toDate();
    const newStartedAtTime = newStartedAt.getTime();

    if (!isNaN(newStartedAtTime)) {
      this.entry.startedAt = newStartedAt;
    }

    const [newStoppedAtHours, newStoppedAtMinutes] = parseHour(
      this.formattedStoppedAt
    );
    let newStoppedAt = moment(this.entry.stoppedAt)
      .hours(newStoppedAtHours)
      .minutes(newStoppedAtMinutes)
      .toDate();
    const newStoppedAtTime = newStoppedAt.getTime();

    if (isNaN(newStoppedAtTime)) {
      newStoppedAt = this.entry.stoppedAt;
    }

    if (moment(newStartedAt).isAfter(newStoppedAt)) {
      newStoppedAt = moment(newStoppedAt).add(1, 'day').toDate();
    } else if (moment(newStoppedAt).diff(moment(newStartedAt), 'days') > 0) {
      newStoppedAt = moment(newStoppedAt).subtract(1, 'day').toDate();
    }
    this.entry.stoppedAt = newStoppedAt;
  }

  _clearFormattedStartedAndStoppedAt() {
    this.formattedStartedAt = null;
    this.formattedStoppedAt = null;
  }
}
