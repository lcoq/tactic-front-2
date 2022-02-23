import Component from '@glimmer/component';
import { reads } from '@ember/object/computed';
import { action, computed } from '@ember/object';
import { service } from '@ember/service';
import { tracked } from '@glimmer/tracking';
import formatDuration from '../utils/format-duration';
import { get, set } from '@ember/object';

export default class CreateEntryComponent extends Component {
  @service deferer;

  @tracked clock = null;
  @tracked clockTimer = null;

  @reads('args.entry') entry;
  @reads('args.isSaveErrored') isSaveErrored;

  @reads('args.searchProjects') searchProjects;
  @reads('args.didUpdateEntry') didUpdateEntry;
  @reads('args.retrySaveEntry') retrySaveEntry;

  @reads('entry.isStarted') isStarted;

  @computed('entry.project.name')
  get projectName() {
    return get(this, 'entry.project.name');
  }
  set projectName(value) {
    return value;
  }

  @computed('entry.startedAt', 'clock')
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
    this.projectName = null;
  }

  @action selectProject(project) {
    this.projectName = project && project.name;
    this.args.setProject(project);
  }

  _updateClock() {
    this.clock = new Date();
    this.clockTimer = this.deferer.later('create-entry:clock', this, this._updateClock);
  }
}
