import Component from '@glimmer/component';
import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';
import moment from 'moment';
import parseHour from '../utils/parse-hour';
import parseDuration from '../utils/parse-duration';
import formatDuration from '../utils/format-duration';
import OnFocusOutClickModifier from '../modifiers/on-focus-out-click';
import NoopModifier from '../modifiers/noop';

export default class ShowEntryComponent extends Component {
  @tracked fieldNameToFocusOnEdit = null;
  @tracked isEditingDate = false;

  @tracked formattedDuration = null;
  @tracked formattedStartedAt = null;
  @tracked formattedStoppedAt = null;

  get onFocusOutClickModifier() {
    return this.isEditing ? OnFocusOutClickModifier : NoopModifier;
  }

  get entry() {
    return this.args.entry;
  }

  get showDate() {
    return !!this.args.showDate;
  }

  get showProjectOnPrint() {
    return !!this.args.showProjectOnPrint;
  }

  get searchProjects() {
    return this.args.searchProjects;
  }

  get rounding() {
    return this.args.rounding;
  }

  get isClear() {
    return this.entry.stateManager.isClear;
  }

  get isEditing() {
    return this.entry.stateManager.isEditing;
  }

  get isPendingDelete() {
    return this.entry.stateManager.isPendingDelete;
  }

  get isPendingSave() {
    return this.entry.stateManager.isPendingSave;
  }

  get isErrored() {
    return this.entry.stateManager.isErrored;
  }

  get isSaveErrored() {
    return this.entry.stateManager.isSaveErrored;
  }

  get isDeleteErrored() {
    return this.entry.stateManager.isDeleteErrored;
  }

  get canRevert() {
    return this.isPendingSave || this.isPendingDelete;
  }

  get canRestartEntry() {
    return this.args.restartEntry && this.isClear;
  }

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
    if (!this.isEditing) {
      this._openEdit(field);
    }
  }

  @action closeEdit() {
    if (this.isEditing) {
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

  @action editEntryDate() {
    if (!this.isEditing) this._openEdit();
    this.isEditingDate = true;
  }

  @action updateEntryDate(newDate) {
    this.entry.updateToDate(newDate);
    this._closeEdit();
  }

  @action async selectProject(project) {
    await this.entry.setProject(project);
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
    if (this.rounding) return;
    this._setFormattedStartedAndStoppedAt();
    if (field) this.fieldNameToFocusOnEdit = field;
    this.entry.stateManager.send('edit');
  }

  _closeEdit() {
    if (this.isEditing) {
      this.isEditingDate = false;
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
    const newStartedAt = this._parseHourAndBuildNewDate(
      this.formattedStartedAt,
      this.entry.startedAt
    );
    const newStartedAtTime = newStartedAt.getTime();

    let newStoppedAt = this._parseHourAndBuildNewDate(
      this.formattedStoppedAt,
      this.entry.stoppedAt
    );
    const newStoppedAtTime = newStoppedAt.getTime();

    if (
      !isNaN(newStartedAtTime) &&
      newStartedAt.getTime() !== this.entry.startedAt.getTime()
    ) {
      this.entry.startedAt = newStartedAt;
    }
    if (isNaN(newStoppedAtTime)) {
      newStoppedAt = this.entry.stoppedAt;
    }
    if (moment(newStartedAt).isAfter(newStoppedAt)) {
      newStoppedAt = moment(newStoppedAt).add(1, 'day').toDate();
    } else if (moment(newStoppedAt).diff(moment(newStartedAt), 'days') > 0) {
      newStoppedAt = moment(newStoppedAt).subtract(1, 'day').toDate();
    }
    if (newStoppedAt.getTime() !== this.entry.stoppedAt.getTime()) {
      this.entry.stoppedAt = newStoppedAt;
    }
  }

  _clearFormattedStartedAndStoppedAt() {
    this.formattedStartedAt = null;
    this.formattedStoppedAt = null;
  }

  _parseHourAndBuildNewDate(raw, baseDate) {
    const [hours, minutes] = parseHour(raw);
    return moment(baseDate).hours(hours).minutes(minutes).toDate();
  }
}
