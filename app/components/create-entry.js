import Component from '@glimmer/component';
import { action } from '@ember/object';
import { service } from '@ember/service';
import { tracked } from '@glimmer/tracking';
import formatDuration from '../utils/format-duration';

export default class CreateEntryComponent extends Component {
  @service deferer;

  @tracked clock = null;
  @tracked clockTimer = null;

  get entry() {
    return this.args.entry;
  }

  get isSaveErrored() {
    return this.args.isSaveErrored;
  }

  get searchProjects() {
    return this.args.searchProjects;
  }

  get didUpdateEntry() {
    return this.args.didUpdateEntry;
  }

  get retrySaveEntry() {
    return this.args.retrySaveEntry;
  }

  get isStarted() {
    return this.entry.isStarted;
  }

  get entryDuration() {
    return formatDuration(this.entry.startedAt, this.clock);
  }

  @action startTimerOrTriggerUpdate() {
    if (!this.isStarted) {
      this.startTimer();
    } else {
      this.didUpdateEntry();
    }
  }

  @action startTimer() {
    if (this.isStarted) return;
    this.args.startTimer();
    this._updateClock();
  }

  @action stopTimer() {
    this.deferer.cancel('create-entry:clock', this.clockTimer);
    this.clockTimer = null;
    this.args.stopTimer();
  }

  @action selectProject(project) {
    this.args.setProject(project);
  }

  constructor() {
    super(...arguments);
    if (this.entry.isStarted) {
      this._updateClock();
    }
  }

  _updateClock() {
    this.clock = new Date();
    this.clockTimer = this.deferer.later(
      'create-entry:clock',
      this,
      this._updateClock
    );
  }
}
